from django.test import TestCase

# Create your tests here.

from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from payments.models import Payment
from students.models import Student


class PaymentAPITests(APITestCase):
    """
    Payment API uchun integratsion testlar.
    Testlar alohida test bazasida ishlaydi.
    """

    @classmethod
    def setUpTestData(cls):
        cls.student = Student.objects.create(
            name="Test O'quvchi",
            phone="+998901234567",
            group_name="Python-01",
            monthly_fee=Decimal("500000.00"),
        )

        cls.other_student = Student.objects.create(
            name="Ikkinchi O'quvchi",
            phone="+998901234568",
            group_name="Python-02",
            monthly_fee=Decimal("400000.00"),
        )

    def setUp(self):
        self.url = reverse("payment-list")

    def create_payment(
        self,
        *,
        student=None,
        amount="100000.00",
        payment_date=date(2026, 10, 20),
    ):
        return Payment.objects.create(
            student=student or self.student,
            amount=Decimal(amount),
            payment_date=payment_date,
        )

    def test_create_payment_success(self):
        """To'g'ri ma'lumot bilan to'lov yaratilishi kerak."""
        payload = {
            "student": self.student.id,
            "amount": "200000.00",
            "payment_date": "2026-10-20",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(Payment.objects.count(), 1)

        payment = Payment.objects.get()

        self.assertEqual(payment.student_id, self.student.id)
        self.assertEqual(payment.amount, Decimal("200000.00"))
        self.assertEqual(payment.payment_date, date(2026, 10, 20))

    def test_zero_amount_is_rejected(self):
        """Nol summali to'lov qabul qilinmasligi kerak."""
        payload = {
            "student": self.student.id,
            "amount": "0.00",
            "payment_date": "2026-10-20",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_negative_amount_is_rejected(self):
        """Manfiy summali to'lov qabul qilinmasligi kerak."""
        payload = {
            "student": self.student.id,
            "amount": "-100.00",
            "payment_date": "2026-10-20",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_nonexistent_student_is_rejected(self):
        """Mavjud bo'lmagan o'quvchiga to'lov yozilmasligi kerak."""
        payload = {
            "student": 999999,
            "amount": "100000.00",
            "payment_date": "2026-10-20",
        }

        response = self.client.post(
            self.url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_list_payments(self):
        """To'lovlar ro'yxati qaytarilishi kerak."""
        self.create_payment(amount="100000.00")
        self.create_payment(amount="200000.00")

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 2)

    def test_filter_payments_by_student(self):
        """student parametri bo'yicha filtrlash ishlashi kerak."""
        self.create_payment(
            student=self.student,
            amount="100000.00",
        )
        self.create_payment(
            student=self.other_student,
            amount="200000.00",
        )

        response = self.client.get(
            self.url,
            {"student": self.student.id},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["student"],
            self.student.id,
        )

    def test_filter_payments_by_month(self):
        """month parametri faqat shu oydagi to'lovlarni qaytarishi kerak."""
        self.create_payment(
            amount="100000.00",
            payment_date=date(2026, 10, 5),
        )
        self.create_payment(
            amount="200000.00",
            payment_date=date(2026, 11, 5),
        )

        response = self.client.get(
            self.url,
            {"month": "2026-10"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["amount"],
            "100000.00",
        )

    def test_invalid_month_is_rejected(self):
        """Noto'g'ri oy formati 400 xato qaytarishi kerak."""
        response = self.client.get(
            self.url,
            {"month": "2026-13"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_december_filter_includes_december_only(self):
        """Dekabr filtri keyingi yil yanvarini qamrab olmasligi kerak."""
        self.create_payment(
            amount="100000.00",
            payment_date=date(2026, 12, 31),
        )
        self.create_payment(
            amount="200000.00",
            payment_date=date(2027, 1, 1),
        )

        response = self.client.get(
            self.url,
            {"month": "2026-12"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["amount"],
            "100000.00",
        )

    def test_student_protected_when_payments_exist(self):
        """To'lovi bor o'quvchini o'chirish himoyalangan bo'lishi kerak."""
        self.create_payment()

        with self.assertRaises(Exception) as context:
            self.student.delete()

        from django.db.models import ProtectedError

        self.assertIsInstance(
            context.exception,
            ProtectedError,
        )
