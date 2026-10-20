from django.db import models

# Create your models here.
from django.core.validators import MinValueValidator


class Payment(models.Model):
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name="O'quvchi",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name="To'lov summasi",
    )
    payment_date = models.DateField(
        verbose_name="To'lov sanasi",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date", "-id"]
        indexes = [
            models.Index(
                fields=["student", "payment_date"],
                name="payment_student_date_idx",
            ),
        ]
        verbose_name = "To'lov"
        verbose_name_plural = "To'lovlar"

    def __str__(self):
        return f"{self.student.name}: {self.amount}"
