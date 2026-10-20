from django.shortcuts import render

# Create your views here.

from rest_framework import mixins, viewsets

from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PaymentSerializer

    def get_queryset(self):
        queryset = Payment.objects.select_related("student").all()

        student_id = self.request.query_params.get("student")
        month = self.request.query_params.get("month")

        if student_id:
            queryset = queryset.filter(student_id=student_id)

        if month:
            import re
            from datetime import date

            if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
                from rest_framework.exceptions import ValidationError

                raise ValidationError({
                    "month": "Format YYYY-MM bo'lishi kerak."
                })

            year, month_number = map(int, month.split("-"))
            start = date(year, month_number, 1)

            if month_number == 12:
                end = date(year + 1, 1, 1)
            else:
                end = date(year, month_number + 1, 1)

            queryset = queryset.filter(
                payment_date__gte=start,
                payment_date__lt=end,
            )

        return queryset
