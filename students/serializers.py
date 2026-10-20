
from rest_framework import serializers

from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=150,
        trim_whitespace=True,
    )
    phone = serializers.CharField(
        max_length=20,
        trim_whitespace=True,
    )
    group_name = serializers.CharField(
        max_length=100,
        trim_whitespace=True,
    )

    class Meta:
        model = Student
        fields = [
            "id",
            "name",
            "phone",
            "group_name",
            "monthly_fee",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError(
                "O'quvchining ismi bo'sh bo'lishi mumkin emas."
            )
        return value

    def validate_phone(self, value):
        if not value:
            raise serializers.ValidationError(
                "Telefon raqami bo'sh bo'lishi mumkin emas."
            )
        return value

    def validate_group_name(self, value):
        if not value:
            raise serializers.ValidationError(
                "Guruh nomi bo'sh bo'lishi mumkin emas."
            )
        return value

    def validate_monthly_fee(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Oylik to'lov manfiy bo'lishi mumkin emas."
            )
        return value



class DebtorSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    name = serializers.CharField()
    phone = serializers.CharField()
    group_name = serializers.CharField()
    monthly_fee = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    paid_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    debt = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
