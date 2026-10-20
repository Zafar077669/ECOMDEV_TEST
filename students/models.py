from django.db import models

# Create your models here.
from django.core.validators import MinValueValidator


class Student(models.Model):
    name = models.CharField(
        max_length=150,
        verbose_name="Ism",
    )
    phone = models.CharField(
        max_length=20,
        verbose_name="Telefon",
    )
    group_name = models.CharField(
        max_length=100,
        verbose_name="Guruh",
    )
    monthly_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Oylik to'lov",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]
        indexes = [
            models.Index(fields=["name"], name="student_name_idx"),
            models.Index(fields=["phone"], name="student_phone_idx"),
        ]
        verbose_name = "O'quvchi"
        verbose_name_plural = "O'quvchilar"

    def __str__(self):
        return f"{self.name} ({self.group_name})"
