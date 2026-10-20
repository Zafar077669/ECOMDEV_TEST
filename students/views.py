
import re
from datetime import date
from decimal import Decimal

from django.db.models import (
    DecimalField,
    F,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce

from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Student
from .serializers import StudentSerializer, DebtorSerializer


MONEY_FIELD = DecimalField(
    max_digits=14,
    decimal_places=2,
)


def get_month_range(month):
    """YYYY-MM parametridan oy boshlanishi va keyingi oy boshini oladi."""
    if not isinstance(month, str) or not re.fullmatch(
        r"\d{4}-(0[1-9]|1[0-2])", month
    ):
        raise ValidationError({
            "month": "Oy YYYY-MM formatida bo'lishi kerak. Masalan: 2026-10."
        })

    year, month_number = map(int, month.split("-"))

    try:
        start = date(year, month_number, 1)

        if month_number == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month_number + 1, 1)

    except ValueError:
        raise ValidationError({
            "month": "Kiritilgan oy uchun sana diapazoni noto'g'ri."
        })

    return start, end


def students_with_monthly_payments(month):
    start, end = get_month_range(month)

    return (
        Student.objects
        .annotate(
            paid_amount=Coalesce(
                Sum(
                    "payments__amount",
                    filter=Q(
                        payments__payment_date__gte=start,
                        payments__payment_date__lt=end,
                    ),
                ),
                Value(Decimal("0.00"), output_field=MONEY_FIELD),
                output_field=MONEY_FIELD,
            )
        )
        .annotate(
            debt=F("monthly_fee") - F("paid_amount")
        )
        .order_by("name", "id")
    )


class StudentViewSet(viewsets.ModelViewSet):
    """O'quvchilarni yaratish, ko'rish, yangilash va o'chirish API'si."""

    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class DebtorListAPIView(APIView):
    """Tanlangan oyda qarzi bor o'quvchilar."""

    def get(self, request):
        month = request.query_params.get("month", "")
        students = students_with_monthly_payments(month).filter(
            debt__gt=0
        ).order_by("-debt", "name", "id")

        results = [
            {
                "student_id": student.id,
                "name": student.name,
                "phone": student.phone,
                "group_name": student.group_name,
                "monthly_fee": student.monthly_fee,
                "paid_amount": student.paid_amount,
                "debt": student.debt,
            }
            for student in students
        ]

        serializer = DebtorSerializer(results, many=True)
        return Response(serializer.data)


class MonthlyReportAPIView(APIView):
    """Barcha o'quvchilar uchun oylik to'lov va qarz hisoboti."""

    def get(self, request):
        month = request.query_params.get("month", "")
        students = students_with_monthly_payments(month)

        results = []
        total_fees = Decimal("0.00")
        total_paid = Decimal("0.00")
        total_debt = Decimal("0.00")
        total_overpaid = Decimal("0.00")

        for student in students:
            fee = student.monthly_fee
            paid = student.paid_amount

            # Ortiqcha to'lovni qarzga aylantirmaymiz.
            debt = max(fee - paid, Decimal("0.00"))
            overpaid = max(paid - fee, Decimal("0.00"))

            if paid == 0:
                status = "unpaid"
            elif paid < fee:
                status = "partial"
            else:
                status = "paid"

            total_fees += fee
            total_paid += paid
            total_debt += debt
            total_overpaid += overpaid

            results.append({
                "student_id": student.id,
                "name": student.name,
                "phone": student.phone,
                "group_name": student.group_name,
                "monthly_fee": fee,
                "paid_amount": paid,
                "debt": debt,
                "overpaid": overpaid,
                "status": status,
            })

        return Response({
            "month": month,
            "summary": {
                "students_count": len(results),
                "total_monthly_fees": total_fees,
                "total_paid": total_paid,
                "total_debt": total_debt,
                "total_overpaid": total_overpaid,
            },
            "results": results,
        })


from django.shortcuts import render


def dashboard(request):
    return render(request, "dashboard.html")