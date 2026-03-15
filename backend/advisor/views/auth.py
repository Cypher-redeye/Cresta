import requests
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import UserProfile
from ..serializers import GoogleAuthSerializer, VerifiedTokenObtainPairSerializer

from rest_framework_simplejwt.views import TokenObtainPairView

class VerifiedTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Google OAuth login.
    Receives access_token, validates with Google, creates/gets Django User,
    returns JWT tokens.
    """
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
        # Update name if changed
        user.first_name = name.split()[0] if name else user.first_name
        user.save(update_fields=['first_name'])

    # Get or create UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if picture:
        profile.picture = picture
        profile.save(update_fields=['picture'])

    # Generate JWT tokens
    tokens = get_tokens_for_user(user)

    return Response({
        'success': True,
        'tokens': tokens,
        'user': {
            'email': user.email,
            'name': name,
            'picture': picture,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    """Refresh an access token using a refresh token."""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
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
        'needs_reassessment': needs_reassessment,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """
    Standard email/password signup.
    Creates a new Django User and UserProfile.
    """
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
        from django.conf import settings

        token = secrets.token_urlsafe(32)
        profile = UserProfile.objects.create(
            user=user,
            email_verified=False,
            verification_token=token,
            verification_token_expires=timezone.now() + timedelta(hours=24)
        )
        
        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
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
        
        return Response({
            'success': True,
            'message': 'Verification email sent. Please check your inbox.',
            'user': {
                'email': user.email,
                'name': name or user.username,
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'detail': f'Error creating user: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email via token."""
    from django.utils import timezone
    token = request.GET.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        profile = UserProfile.objects.get(verification_token=token)
        
        if profile.verification_token_expires < timezone.now():
            return Response({'error': 'Token expired. Please sign up again.'}, status=status.HTTP_400_BAD_REQUEST)
            
        profile.email_verified = True
        profile.verification_token = ''
        profile.save()
        
        return Response({'message': 'Email verified successfully. You can now log in.'})
    except UserProfile.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
