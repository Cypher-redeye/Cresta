import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('security')

def custom_exception_handler(exc, context):
    """
    Custom exception handler to prevent leaking stack traces 
    or internal API details to the frontend.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If the exception is unhandled by DRF (like standard python Exceptions), response is None
    if response is None:
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return Response({
            "error": "An internal server error occurred."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
