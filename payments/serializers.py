
from decimal import Decimal

from rest_framework import serializers

from students.models import Student
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
    )

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "student",
            "amount",
            "payment_date",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(
                "To'lov summasi noldan katta bo'lishi kerak."
            )

        return value
