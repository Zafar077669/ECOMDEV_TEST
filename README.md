# EduPay — O‘quv markazi uchun to‘lovlarni boshqarish tizimi

O‘quv markazlarida o‘quvchilar, oylik to‘lovlar va qarzdorlikni hisobga olish uchun ishlab chiqilgan veb-ilova va REST API.

**Loyiha:** Ecomdev developer test topshirig‘i  
**Backend:** Python, Django, Django REST Framework  
**Ma’lumotlar bazasi:** SQLite  
**Frontend:** HTML5, CSS3, JavaScript  
**Testlar:** 24 ta avtomatlashtirilgan test muvaffaqiyatli o‘tgan

---

## 1. Loyiha haqida

EduPay o‘quv markaziga o‘quvchilarni ro‘yxatga olish, ularning oylik to‘lovlarini belgilash, amalga oshirilgan to‘lovlarni qayd etish va tanlangan oy uchun qarzdorlikni aniqlash imkonini beradi.

Tizimning asosiy maqsadi — o‘quv markazining moliyaviy hisob-kitoblarini sodda, tushunarli va markazlashgan shaklda boshqarish.

### Asosiy imkoniyatlar

- O‘quvchilarni yaratish, ro‘yxatini ko‘rish, tahrirlash va o‘chirish.
- O‘quvchining ismi, telefon raqami, guruhi va oylik to‘lov summasini saqlash.
- To‘lovlarni o‘quvchi, summa va sana bilan qayd etish.
- O‘quvchining to‘lovlarini ro‘yxatlash va filtrlash.
- Tanlangan oy bo‘yicha qarzdor o‘quvchilarni aniqlash.
- Har bir o‘quvchining oylik to‘lovi, to‘langan summasi va qolgan qarzini hisoblash.
- Oylik moliyaviy hisobot uchun API’dan foydalanish.
- Veb-dashboard orqali o‘quvchilar va to‘lovlarni boshqarish.
- Mobil qurilmalarda foydalanishga mos interfeys.

## 2. Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Dasturlash tili | Python |
| Backend | Django |
| REST API | Django REST Framework |
| Ma’lumotlar bazasi | SQLite |
| Frontend | HTML5, CSS3, JavaScript |
| Testlash | Django Test Framework |
| Versiyalar nazorati | Git, GitHub |

## 3. Loyihani ishga tushirish

### Talablar

- Python 3.12 yoki unga mos keladigan Python versiyasi.
- Git.
- Terminal yoki Windows Command Prompt.

### 1-qadam. Repozitoriyani yuklab olish

```bash
git clone https://github.com/Zafar077669/ECOMDEV_TEST.git
cd ECOMDEV_TEST
```

### 2-qadam. Virtual muhit yaratish

Windows uchun:

```bash
py -3.12 -m venv venv
venv\Scripts\activate
```

Agar `py -3.12` buyrug‘i ishlamasa, kompyuterdagi o‘rnatilgan Python versiyasidan foydalaning.

### 3-qadam. Kerakli kutubxonalarni o‘rnatish

```bash
python -m pip install Django==5.2.18 djangorestframework==3.18.3
```

### 4-qadam. Ma’lumotlar bazasini tayyorlash

```bash
python manage.py migrate
```

### 5-qadam. Avtomatik testlarni ishga tushirish

```bash
python manage.py test
```

### 6-qadam. Lokal serverni ishga tushirish

```bash
python manage.py runserver
```

Brauzerda quyidagi manzilni oching:

http://127.0.0.1:8000/

**Eslatma:** ushbu yo‘riqnoma standart Django/SQLite muhitiga mo‘ljallangan. Toza muhitda o‘rnatish va ishga tushirish alohida tekshirilishi kerak.

## 4. API hujjatlari

### 4.1. O‘quvchilar

| Metod | Endpoint | Vazifasi |
|---|---|---|
| GET | `/api/students/` | O‘quvchilar ro‘yxatini olish |
| POST | `/api/students/` | Yangi o‘quvchi yaratish |
| GET | `/api/students/<id>/` | Bitta o‘quvchini olish |
| PUT | `/api/students/<id>/` | O‘quvchi ma’lumotlarini to‘liq yangilash |
| PATCH | `/api/students/<id>/` | O‘quvchi ma’lumotlarini qisman yangilash |
| DELETE | `/api/students/<id>/` | O‘quvchini o‘chirish |

Yangi o‘quvchi yaratish uchun JSON namunasi:

```json
{
  "name": "Ali Valiyev",
  "phone": "+998901234567",
  "group_name": "Python-01",
  "monthly_fee": "500000.00"
}
```

### 4.2. To‘lovlar

| Metod | Endpoint | Vazifasi |
|---|---|---|
| GET | `/api/payments/` | To‘lovlar ro‘yxatini olish |
| POST | `/api/payments/` | Yangi to‘lov qayd etish |

To‘lovlarni o‘quvchi bo‘yicha filtrlash:

```text
/api/payments/?student=1
```

To‘lov yaratish uchun JSON namunasi:

```json
{
  "student": 1,
  "amount": "200000.00",
  "payment_date": "2026-10-20"
}
```

`student` qiymati mavjud o‘quvchining identifikatori bo‘lishi kerak.

### 4.3. Oylik qarzdorlik

**Endpoint:**

```http
GET /debtors?month=2026-10
```

`month` parametri `YYYY-MM` formatida yuboriladi.

API tanlangan oy uchun oylik to‘lovini to‘liq amalga oshirmagan o‘quvchilarni va ularning qolgan qarzini qaytaradi.

Hisoblash tamoyili:

```text
Qarz = Oylik to‘lov − Tanlangan oyda to‘langan summa
```

Faqat qarzi noldan katta bo‘lgan o‘quvchilar qarzdorlar ro‘yxatiga kiritiladi.

Masalan, oylik to‘lov 500 000 so‘m, amalga oshirilgan to‘lovlar yig‘indisi 200 000 so‘m bo‘lsa, qarz 300 000 so‘m bo‘ladi.

### 4.4. Oylik hisobot

```http
GET /api/reports/monthly/
```

Loyihada oylik hisobot uchun alohida API endpoint mavjud. Uning aniq javob formati va hisoblash tafsilotlarini tegishli view va testlar orqali tekshirish mumkin.

## 5. Veb-interfeys

EduPay dashboard quyidagi bo‘limlarni o‘z ichiga oladi:

- **Umumiy ko‘rinish:** o‘quvchilar soni va tanlangan oy bo‘yicha qarzdorlik ko‘rsatkichlari.
- **Qarzdorlar ro‘yxati:** oylik to‘lov, to‘langan summa va qolgan qarz.
- **O‘quvchilar:** o‘quvchi qo‘shish, qidirish, tahrirlash va o‘chirish.
- **To‘lov kiritish:** o‘quvchini tanlash, summani va to‘lov sanasini kiritish.

Frontend Django REST API bilan ishlaydi va ma’lumotlarni serverdan oladi.

## 6. Testlash va tekshiruv

Loyiha ishlab chiqish jarayonida Django test tizimi orqali tekshirildi.

**Oxirgi taqdim etilgan test natijasi:**

```text
Found 24 test(s).
System check identified no issues (0 silenced).
........................
Ran 24 tests in 0.141s

OK
```

Natija: **24 ta test muvaffaqiyatli o‘tgan.**

Testlarni qayta ishga tushirish:

```bash
python manage.py test
```

Django konfiguratsiyasini tekshirish:

```bash
python manage.py check
```

Ushbu natija mavjud testlar muvaffaqiyatli bajarilganini bildiradi; u barcha mumkin bo‘lgan holatlar yoki ishlab chiqarish serveridagi ishlash kafolati emas.

## 7. Ma’lumotlar modeli

### Student

O‘quvchi haqidagi ma’lumotlarni saqlaydi:

- `name` — o‘quvchining to‘liq ismi.
- `phone` — telefon raqami.
- `group_name` — guruh nomi.
- `monthly_fee` — oylik to‘lov summasi.
- `created_at` — yaratilgan vaqt.
- `updated_at` — oxirgi yangilangan vaqt.

### Payment

O‘quvchining to‘lovlarini saqlaydi:

- `student` — tegishli o‘quvchiga tashqi kalit.
- `amount` — to‘lov summasi.
- `payment_date` — to‘lov sanasi.
- `created_at` — yozuv yaratilgan vaqt.

To‘lov va o‘quvchi o‘rtasidagi bog‘lanish ma’lumotlarning izchilligini saqlashga yordam beradi.

## 8. Keyingi rivojlantirish rejalari

Loyihani yana bir hafta davomida rivojlantirish imkoniyati bo‘lsa, quyidagi yaxshilanishlar ustuvor bo‘ladi:

1. **Autentifikatsiya va rollar:** administrator va xodimlar uchun kirish, ruxsatlar hamda himoyalangan endpointlar.
2. **Kengaytirilgan hisobotlar:** sana oralig‘i, guruhlar bo‘yicha tushum va qarzdorlik tahlili.
3. **Ma’lumotlarni eksport qilish:** hisobotlarni Excel yoki CSV formatida yuklab olish.
4. **Avtomatlashtirilgan eslatmalar:** qarzdorlik bo‘yicha xabarnomalar va to‘lov eslatmalari.
5. **Ishlab chiqarish muhitiga tayyorlash:** PostgreSQL, muhit o‘zgaruvchilari, xavfsizlik sozlamalari va avtomatik deploy jarayoni.

Bu bandlar kelgusidagi rivojlantirish rejasidir; ular hozirgi versiyada mavjud deb da’vo qilinmaydi.

## 9. Loyiha havolasi

GitHub repository:

https://github.com/Zafar077669/ECOMDEV_TEST

---

**Muallif:** Zafar Sharipov

*EduPay — o‘quv markazi to‘lovlarini boshqarish uchun ishlab chiqilgan test loyihasi.*
