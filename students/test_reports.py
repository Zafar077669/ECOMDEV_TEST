
from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from students.models import Student
from payments.models import Payment


class MonthlyReportAPITests(APITestCase):
    def setUp(self):
        self.student = Student.objects.create(
            name="Test O'quvchi",
            phone="+998901234567",
            group_name="Python-01",
            monthly_fee=Decimal("500000.00"),
        )

        self.url = "/api/reports/monthly/"

    def create_payment(self, amount, payment_date):
        return Payment.objects.create(
            student=self.student,
            amount=Decimal(amount),
            payment_date=date.fromisoformat(payment_date),
        )

    def get_report(self, month="2026-10"):
        return self.client.get(
            self.url,
            {"month": month},
            format="json",
        )

    def test_unpaid_student_has_full_debt(self):
        response = self.get_report()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_debt"], 500000)
        self.assertEqual(response.data["results"][0]["status"], "unpaid")

    def test_partial_payment_calculates_remaining_debt(self):
        self.create_payment("200000.00", "2026-10-10")

        response = self.get_report()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["paid_amount"], 200000)
        self.assertEqual(response.data["results"][0]["debt"], 300000)
        self.assertEqual(response.data["results"][0]["status"], "partial")

    def test_fully_paid_student_has_no_debt(self):
        self.create_payment("500000.00", "2026-10-10")

        response = self.get_report()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["debt"], 0)
        self.assertEqual(response.data["results"][0]["status"], "paid")

    def test_overpayment_is_calculated(self):
        self.create_payment("550000.00", "2026-10-10")

        response = self.get_report()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["overpaid"], 50000)
        self.assertEqual(response.data["summary"]["total_overpaid"], 50000)

    def test_payment_from_another_month_is_excluded(self):
        self.create_payment("200000.00", "2026-09-30")

        response = self.get_report()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["paid_amount"], 0)
        self.assertEqual(response.data["results"][0]["debt"], 500000)

    def test_invalid_month_returns_400(self):
        response = self.get_report("2026-13")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_month_returns_400(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
