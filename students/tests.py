from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from students.models import Student
from payments.models import Payment


class DebtorListAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.student = Student.objects.create(
            name="Test Oquvchi",
            phone="+998901112233",
            group_name="Python-Test",
            monthly_fee=Decimal("500000.00"),
        )

    def create_payment(self, amount, payment_date):
        return Payment.objects.create(
            student=self.student,
            amount=Decimal(amount),
            payment_date=date.fromisoformat(payment_date),
        )

    def get_debtors(self, month="2026-10"):
        return self.client.get(
            "/debtors",
            {"month": month},
            format="json",
        )

    def test_partially_paid_student_is_debtor(self):
        self.create_payment("200000.00", "2026-10-10")

        response = self.get_debtors()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            Decimal(response.data[0]["paid_amount"]),
            Decimal("200000.00"),
        )
        self.assertEqual(
            Decimal(response.data[0]["debt"]),
            Decimal("300000.00"),
        )

    def test_unpaid_student_is_debtor(self):
        response = self.get_debtors()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            Decimal(response.data[0]["debt"]),
            Decimal("500000.00"),
        )

    def test_fully_paid_student_is_not_debtor(self):
        self.create_payment("500000.00", "2026-10-10")

        response = self.get_debtors()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_overpaid_student_is_not_debtor(self):
        self.create_payment("600000.00", "2026-10-10")

        response = self.get_debtors()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_payment_from_another_month_is_excluded(self):
        self.create_payment("200000.00", "2026-09-30")

        response = self.get_debtors()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            Decimal(response.data[0]["paid_amount"]),
            Decimal("0.00"),
        )
        self.assertEqual(
            Decimal(response.data[0]["debt"]),
            Decimal("500000.00"),
        )

    def test_month_parameter_is_required(self):
        response = self.client.get("/debtors")

        self.assertEqual(response.status_code, 400)

    def test_invalid_month_is_rejected(self):
        response = self.get_debtors("2026-13")

        self.assertEqual(response.status_code, 400)
