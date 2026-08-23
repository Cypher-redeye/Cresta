import logging
import requests
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes, throttle_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import UserProfile
from ..serializers import GoogleAuthSerializer, VerifiedTokenObtainPairSerializer

from rest_framework_simplejwt.views import TokenObtainPairView

security_logger = logging.getLogger('security')


def _set_token_cookies(response, tokens):
    """P0-4 FIX: Set JWT tokens as httpOnly secure cookies."""
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        tokens['access'],
        max_age=15 * 60,  # 15 minutes
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/',
    )
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        tokens['refresh'],
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/api/auth/',
    )
    return response


def _clear_token_cookies(response):
    """Clear JWT cookies on logout."""
    response.delete_cookie(settings.JWT_ACCESS_COOKIE_NAME, path='/')
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME, path='/api/auth/')
    return response


class VerifiedTokenObtainPairView(TokenObtainPairView):
    """1.3 FIX: Scoped throttle for login brute-force protection."""
    serializer_class = VerifiedTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        # 7.2 FIX: Log successful/failed login attempts
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
        username = request.data.get('username', request.data.get('email', 'unknown'))

        if response.status_code == 200:
            security_logger.info(f"LOGIN_SUCCESS user={username} ip={ip}")
            # Set httpOnly cookies
            tokens = {'access': response.data['access'], 'refresh': response.data['refresh']}
            _set_token_cookies(response, tokens)
            
            # Keep tokens in JSON body so frontend can update localStorage
            response.data['success'] = True
            response.data['message'] = 'Login successful'
        else:
            security_logger.warning(f"LOGIN_FAILED user={username} ip={ip}")

        return response


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def google_login(request):
    """
    Google OAuth login.
    Receives access_token, validates with Google, creates/gets Django User,
    returns JWT tokens + sets httpOnly cookies.
    """
    request.throttle_scope = 'login'

    serializer = GoogleAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    access_token = serializer.validated_data['access_token']

    # Fetch user info from Google
    try:
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        if google_response.status_code != 200:
            return Response(
                {'error': 'Failed to fetch user info from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response({'error': f'Google API error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    user_info = google_response.json()
    email = user_info.get('email')
    name = user_info.get('name', email.split('@')[0] if email else 'Google User')
    picture = user_info.get('picture', '')

    if not email:
        return Response({'error': 'No email returned from Google'}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create Django User
    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            'email': email,
            'first_name': name.split()[0] if name else '',
            'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else '',
        }
    )

    if not created:
        user.first_name = name.split()[0] if name else user.first_name
        user.save(update_fields=['first_name'])

    # Get or create UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if picture:
        profile.picture = picture
        profile.save(update_fields=['picture'])

    from django.utils import timezone
    from datetime import timedelta
    needs_reassessment = True
    if profile.last_assessment_date:
        age = timezone.now() - profile.last_assessment_date
        needs_reassessment = age > timedelta(days=180)

    # Generate JWT tokens
    tokens = get_tokens_for_user(user)

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
    security_logger.info(f"GOOGLE_LOGIN user={email} ip={ip}")

    response = Response({
        'success': True,
        'message': 'Google login successful',
        'tokens': tokens,
        'user': {
            'email': user.email,
            'name': name,
            'picture': profile.picture,
            'risk_profile': profile.risk_profile,
            'risk_score': profile.risk_score,
            'investment_goal': profile.investment_goal,
            'age': profile.age,
            'income': profile.income,
            'needs_reassessment': needs_reassessment,
        }
    })

    # P0-4: Set httpOnly cookies
    _set_token_cookies(response, tokens)
    return response


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def token_refresh(request):
    """Refresh an access token using a refresh token (cookie or body)."""
    # P0-4: Try cookie first, then request body
    refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME) or request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        tokens = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        response = Response({
            'success': True,
            'message': 'Token refreshed successfully',
            'tokens': tokens,
        })
        _set_token_cookies(response, tokens)
        return response
    except Exception as e:
        return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    """Get the current authenticated user's info + re-assessment flag."""
    from django.utils import timezone
    from datetime import timedelta

    user = request.user
    profile = getattr(user, 'profile', None)

    # Dynamic risk re-assessment: suggest update every 6 months
    needs_reassessment = True
    if profile and profile.last_assessment_date:
        age = timezone.now() - profile.last_assessment_date
        needs_reassessment = age > timedelta(days=180)

    return Response({
        'email': user.email,
        'name': user.get_full_name() or user.username,
        'picture': profile.picture if profile else '',
        'risk_profile': profile.risk_profile if profile else '',
        'risk_score': profile.risk_score if profile else None,
        'investment_goal': profile.investment_goal if profile else '',
        'age': profile.age if profile else None,
        'income': profile.income if profile else None,
        'needs_reassessment': needs_reassessment,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def signup(request):
    """
    Standard email/password signup.
    Creates a new Django User and UserProfile.
    """
    request.throttle_scope = 'login'

    username = request.data.get('username') or request.data.get('email')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '')

    if not email or not password:
        return Response(
            {'detail': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
        return Response(
            {'detail': 'User with this email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
        )
        
        # Create profile with verification token
        import secrets
        from datetime import timedelta
        from django.utils import timezone
        from django.core.mail import send_mail

        from django.contrib.auth.hashers import make_password

        token = secrets.token_urlsafe(32)
        profile = UserProfile.objects.create(
            user=user,
            email_verified=False,
            verification_token_hash=make_password(token),
            verification_token_expires=timezone.now() + timedelta(hours=24)
        )
        
        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}&email={user.email}"
        
        send_mail(
            subject='Verify your Cresta account',
            html_message=f'''
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0d0d0d;color:#ffffff;border-radius:12px;border:1px solid rgba(16,185,129,0.2)">
              <h2 style="color:#10B981">Welcome to Cresta</h2>
              <p>Click the button below to verify your email address.</p>
              <a href="{verification_url}" style="display:inline-block;padding:12px 24px;background:#10B981;color:#000;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
              <p style="color:#666;font-size:12px">Link expires in 24 hours. If you didn't create a Cresta account, ignore this email.</p>
            </div>
            ''',
            message=f'Verify your Cresta account: {verification_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
        security_logger.info(f"SIGNUP user={email} ip={ip}")

        tokens = get_tokens_for_user(user)
        
        return Response({
            'success': True,
            'message': 'Verification email sent. Please check your inbox.',
            'tokens': tokens,
            'user': {
                'email': user.email,
                'username': user.username,
                'name': name or user.username,
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'detail': f'Error creating user: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email via POST with hashed token."""
    from django.utils import timezone
    from django.contrib.auth.hashers import check_password
    
    token = request.data.get('token')
    email = request.data.get('email')
    
    if not token or not email:
        return Response({'error': 'Token and email are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        profile = getattr(user, 'profile', None)
        
        if not profile or not profile.verification_token_hash:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if profile.verification_token_expires < timezone.now():
            return Response({'error': 'Token expired. Please sign up again.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not check_password(token, profile.verification_token_hash):
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
            
        profile.email_verified = True
        profile.verification_token_hash = ''
        profile.save()
        
        tokens = get_tokens_for_user(user)
        
        return Response({
            'message': 'Email verified successfully',
            'tokens': tokens,
        })
    except User.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
