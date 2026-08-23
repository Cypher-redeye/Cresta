"""
Cookie-based JWT Authentication for DRF.
Reads access_token from httpOnly cookie, falls back to Authorization header.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied

def enforce_csrf(request):
    """
    Enforce CSRF validation for cookie-based authentication.
    """
    check = CSRFCheck(lambda req: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise PermissionDenied('CSRF Failed: %s' % reason)

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that checks httpOnly cookies first,
    then falls back to the standard Authorization header.
    """

    def authenticate(self, request):
        # 1. Try standard Authorization header first
        # If token is explicitly in header, it's not a CSRF attack (requires JS)
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        # 2. Try cookie fallback
        raw_token = request.COOKIES.get('access_token')
        if raw_token:
            validated_token = self.get_validated_token(raw_token)
            enforce_csrf(request)
            return self.get_user(validated_token), validated_token

        return None
