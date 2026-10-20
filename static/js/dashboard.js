
"use strict";

/**
 * EduPay — Education Finance Dashboard
 * Django REST Framework API integration.
 *
 * GET     /api/students/
 * POST    /api/students/
 * PATCH   /api/students/:id/
 * DELETE  /api/students/:id/
 * GET     /api/payments/
 * POST    /api/payments/
 * GET     /debtors?month=YYYY-MM
 *
 * Talablar:
 * - dashboard.html element ID'lari mos bo'lishi kerak.
 * - Django API student CRUD endpointlarini qo'llab-quvvatlashi kerak.
 * - Tashqi JavaScript kutubxonasi talab qilinmaydi.
 */

(() => {
    const API = Object.freeze({
        students: "/api/students/",
        payments: "/api/payments/",
        debtors: "/debtors",
    });

    const STUDENT_COLUMNS = 5;
    const DEBTOR_COLUMNS = 6;

    const state = {
        students: [],
        debtors: [],
        selectedMonth: "",
        loadingStudents: false,
        loadingDebtors: false,
        submittingPayment: false,
        submittingStudent: false,
        editingStudentId: null,
        refreshVersion: 0,
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", initialize);

    async function initialize() {
        cacheElements();

        if (
            !elements.studentsTable ||
            !elements.debtorsTable ||
            !elements.paymentForm ||
            !elements.reportMonth
        ) {
            console.error(
                "EduPay: kerakli HTML elementlar topilmadi. " +
                "dashboard.html ID'larini tekshiring."
            );
            return;
        }

        state.selectedMonth = currentLocalMonth();
        elements.reportMonth.value = state.selectedMonth;

        if (elements.paymentDate) {
            elements.paymentDate.value = currentLocalDate();
        }

        bindEvents();

        setTableMessage(
            elements.studentsTable,
            STUDENT_COLUMNS,
            "O‘quvchilar yuklanmoqda..."
        );

        setTableMessage(
            elements.debtorsTable,
            DEBTOR_COLUMNS,
            "Qarzdorlar yuklanmoqda..."
        );

        await refreshDashboard();
    }

    function cacheElements() {
        elements.reportMonth = document.getElementById("report-month");
        elements.totalStudents = document.getElementById("total-students");
        elements.totalDebtors = document.getElementById("total-debtors");
        elements.totalDebt = document.getElementById("total-debt");

        elements.studentsTable = document.getElementById("students-table");
        elements.debtorsTable = document.getElementById("debtors-table");

        elements.studentSearch = document.getElementById("student-search");
        elements.showStudentForm = document.getElementById("show-student-form");
        elements.studentFormPanel = document.getElementById("student-form-panel");
        elements.studentForm = document.getElementById("student-form");
        elements.studentFormTitle = document.getElementById("student-form-title");
        elements.studentId = document.getElementById("student-id");
        elements.studentName = document.getElementById("student-name");
        elements.studentPhone = document.getElementById("student-phone");
        elements.studentGroup = document.getElementById("student-group");
        elements.studentMonthlyFee = document.getElementById("student-monthly-fee");
        elements.saveStudent = document.getElementById("save-student");
        elements.cancelStudentForm = document.getElementById("cancel-student-form");
        elements.studentMessage = document.getElementById("student-message");

        elements.paymentForm = document.getElementById("payment-form");
        elements.paymentStudent = document.getElementById("payment-student");
        elements.paymentAmount = document.getElementById("payment-amount");
        elements.paymentDate = document.getElementById("payment-date");
        elements.paymentMessage = document.getElementById("payment-message");
        elements.submitPayment = document.getElementById("submit-payment");

        elements.refreshButton = document.getElementById("refresh-button");
    }

    function bindEvents() {
        elements.reportMonth.addEventListener("change", async () => {
            const month = elements.reportMonth.value;

            if (!isValidMonth(month)) {
                showMessage(
                    "Hisobot uchun to‘g‘ri oy tanlang.",
                    "error"
                );
                return;
            }

            state.selectedMonth = month;
            await loadDebtors();
        });

        elements.refreshButton?.addEventListener("click", refreshDashboard);

        elements.studentSearch?.addEventListener("input", renderStudents);

        elements.showStudentForm?.addEventListener(
            "click",
            openCreateStudentForm
        );

        elements.cancelStudentForm?.addEventListener(
            "click",
            closeStudentForm
        );

        elements.studentForm?.addEventListener(
            "submit",
            submitStudent
        );

        elements.studentsTable.addEventListener("click", handleStudentTableClick);
        elements.debtorsTable.addEventListener("click", handleDebtorTableClick);

        elements.paymentForm.addEventListener("submit", submitPayment);
    }

    // ---------------------------------------------------------
    // DASHBOARD REFRESH
    // ---------------------------------------------------------

    async function refreshDashboard() {
        const version = ++state.refreshVersion;
        setRefreshLoading(true);

        try {
            await loadStudents();

            if (version !== state.refreshVersion) {
                return;
            }

            await loadDebtors();
        } catch (error) {
            console.error("EduPay dashboard xatosi:", error);
        } finally {
            if (version === state.refreshVersion) {
                setRefreshLoading(false);
            }
        }
    }

    async function loadStudents() {
        state.loadingStudents = true;

        try {
            const payload = await apiRequest(API.students);
            state.students = extractList(payload);

            renderStudents();
            renderStudentOptions();

            if (elements.totalStudents) {
                elements.totalStudents.textContent =
                    formatNumber(getTotalStudentCount(payload));
            }
        } catch (error) {
            console.error("O‘quvchilarni yuklash xatosi:", error);

            if (elements.totalStudents) {
                elements.totalStudents.textContent = "—";
            }

            setTableMessage(
                elements.studentsTable,
                STUDENT_COLUMNS,
                error.message || "O‘quvchilarni yuklab bo‘lmadi."
            );
        } finally {
            state.loadingStudents = false;
        }
    }

    async function loadDebtors() {
        if (!isValidMonth(state.selectedMonth)) {
            return;
        }

        state.loadingDebtors = true;

        setTableMessage(
            elements.debtorsTable,
            DEBTOR_COLUMNS,
            "Qarzdorlik ma’lumotlari yuklanmoqda..."
        );

        try {
            const url =
                `${API.debtors}?month=${encodeURIComponent(state.selectedMonth)}`;

            const payload = await apiRequest(url);
            state.debtors = extractList(payload);

            renderDebtors();

            if (elements.totalDebtors) {
                elements.totalDebtors.textContent =
                    formatNumber(state.debtors.length);
            }

            if (elements.totalDebt) {
                const total = state.debtors.reduce(
                    (sum, debtor) => sum + getDebtAmount(debtor),
                    0
                );

                elements.totalDebt.textContent = formatCurrency(total);
            }
        } catch (error) {
            console.error("Qarzdorlarni yuklash xatosi:", error);

            state.debtors = [];

            if (elements.totalDebtors) {
                elements.totalDebtors.textContent = "—";
            }

            if (elements.totalDebt) {
                elements.totalDebt.textContent = "—";
            }

            setTableMessage(
                elements.debtorsTable,
                DEBTOR_COLUMNS,
                error.message || "Qarzdorlarni yuklab bo‘lmadi."
            );
        } finally {
            state.loadingDebtors = false;
        }
    }

    // ---------------------------------------------------------
    // STUDENT CREATE / EDIT / DELETE
    // ---------------------------------------------------------

    function openCreateStudentForm() {
        if (!elements.studentForm || !elements.studentFormPanel) {
            console.error("EduPay: o‘quvchi formasi HTML'da topilmadi.");
            return;
        }

        state.editingStudentId = null;
        elements.studentForm.reset();

        if (elements.studentId) {
            elements.studentId.value = "";
        }

        if (elements.studentFormTitle) {
            elements.studentFormTitle.textContent = "Yangi o‘quvchi";
        }

        if (elements.saveStudent) {
            elements.saveStudent.textContent = "O‘quvchini saqlash";
        }

        if (elements.showStudentForm) {
            elements.showStudentForm.setAttribute("aria-expanded", "true");
        }

        elements.studentFormPanel.hidden = false;
        showStudentMessage("", "");

        elements.studentName?.focus();

        elements.studentFormPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }

    function openEditStudentForm(studentId) {
        const student = state.students.find(
            (item) => String(item.id) === String(studentId)
        );

        if (!student) {
            showStudentMessage(
                "Tahrirlanadigan o‘quvchi topilmadi. Ro‘yxatni yangilang.",
                "error"
            );
            return;
        }

        if (!elements.studentForm || !elements.studentFormPanel) {
            return;
        }

        state.editingStudentId = student.id;

        elements.studentId.value = String(student.id);
        elements.studentName.value = student.name ?? "";
        elements.studentPhone.value = student.phone ?? "";
        elements.studentGroup.value = student.group_name ?? "";
        elements.studentMonthlyFee.value = student.monthly_fee ?? "";

        if (elements.studentFormTitle) {
            elements.studentFormTitle.textContent = "O‘quvchini tahrirlash";
        }

        if (elements.saveStudent) {
            elements.saveStudent.textContent = "O‘zgarishlarni saqlash";
        }

        if (elements.showStudentForm) {
            elements.showStudentForm.setAttribute("aria-expanded", "true");
        }

        elements.studentFormPanel.hidden = false;
        showStudentMessage("", "");

        elements.studentFormPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });

        elements.studentName?.focus();
    }

    function closeStudentForm() {
        if (elements.studentFormPanel) {
            elements.studentFormPanel.hidden = true;
        }

        if (elements.showStudentForm) {
            elements.showStudentForm.setAttribute("aria-expanded", "false");
        }

        if (elements.studentForm) {
            elements.studentForm.reset();
        }

        if (elements.studentId) {
            elements.studentId.value = "";
        }

        state.editingStudentId = null;
        showStudentMessage("", "");

        if (elements.studentFormTitle) {
            elements.studentFormTitle.textContent = "Yangi o‘quvchi";
        }

        if (elements.saveStudent) {
            elements.saveStudent.textContent = "O‘quvchini saqlash";
        }
    }

    async function submitStudent(event) {
        event.preventDefault();

        if (state.submittingStudent) {
            return;
        }

        const name = elements.studentName?.value.trim() ?? "";
        const phone = elements.studentPhone?.value.trim() ?? "";
        const groupName = elements.studentGroup?.value.trim() ?? "";
        const monthlyFeeText = elements.studentMonthlyFee?.value ?? "";
        const monthlyFee = Number(monthlyFeeText);

        if (!name || !phone || !groupName || monthlyFeeText.trim() === "") {
            showStudentMessage(
                "Barcha maydonlarni to‘ldiring.",
                "error"
            );
            return;
        }

        if (!Number.isFinite(monthlyFee) || monthlyFee < 0) {
            showStudentMessage(
                "Oylik to‘lov 0 yoki undan katta son bo‘lishi kerak.",
                "error"
            );
            elements.studentMonthlyFee?.focus();
            return;
        }

        const payload = {
            name,
            phone,
            group_name: groupName,
            monthly_fee: monthlyFee.toFixed(2),
        };

        const editingId = state.editingStudentId;
        const url = editingId === null
            ? API.students
            : `${API.students}${encodeURIComponent(editingId)}/`;

        state.submittingStudent = true;
        setStudentFormBusy(true);

        showStudentMessage("Ma’lumotlar saqlanmoqda...", "");

        try {
            await apiRequest(url, {
                method: editingId === null ? "POST" : "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...csrfHeaders(),
                },
                body: JSON.stringify(payload),
            });

            showStudentMessage(
                editingId === null
                    ? "O‘quvchi muvaffaqiyatli qo‘shildi."
                    : "O‘quvchi ma’lumotlari yangilandi.",
                "success"
            );

            closeStudentForm();
            await refreshDashboard();
        } catch (error) {
            console.error("O‘quvchini saqlash xatosi:", error);

            showStudentMessage(
                error.message || "O‘quvchini saqlab bo‘lmadi.",
                "error"
            );
        } finally {
            state.submittingStudent = false;
            setStudentFormBusy(false);
        }
    }

    async function deleteStudent(studentId) {
        const student = state.students.find(
            (item) => String(item.id) === String(studentId)
        );

        if (!student) {
            showStudentMessage("O‘quvchi topilmadi.", "error");
            return;
        }

        const confirmed = window.confirm(
            `“${student.name}” o‘quvchisini o‘chirmoqchimisiz?\n\n` +
            "Bu amalni qaytarib bo‘lmasligi mumkin."
        );

        if (!confirmed) {
            return;
        }

        try {
            await apiRequest(
                `${API.students}${encodeURIComponent(studentId)}/`,
                {
                    method: "DELETE",
                    headers: {
                        ...csrfHeaders(),
                    },
                }
            );

            if (String(state.editingStudentId) === String(studentId)) {
                closeStudentForm();
            }

            await refreshDashboard();
        } catch (error) {
            console.error("O‘quvchini o‘chirish xatosi:", error);

            window.alert(
                "O‘quvchini o‘chirib bo‘lmadi.\n\n" +
                (error.message ||
                    "Server javobini va o‘quvchiga bog‘langan to‘lovlarni tekshiring.")
            );
        }
    }

    function handleStudentTableClick(event) {
        const button = event.target.closest("button[data-student-action]");

        if (!button || !elements.studentsTable.contains(button)) {
            return;
        }

        const studentId = button.dataset.studentId;
        const action = button.dataset.studentAction;

        if (!studentId) {
            return;
        }

        if (action === "edit") {
            openEditStudentForm(studentId);
        } else if (action === "delete") {
            deleteStudent(studentId);
        }
    }

    function setStudentFormBusy(isBusy) {
        if (elements.saveStudent) {
            elements.saveStudent.disabled = isBusy;
            elements.saveStudent.textContent = isBusy
                ? "Saqlanmoqda..."
                : state.editingStudentId === null
                    ? "O‘quvchini saqlash"
                    : "O‘zgarishlarni saqlash";
        }

        if (elements.cancelStudentForm) {
            elements.cancelStudentForm.disabled = isBusy;
        }
    }

    // ---------------------------------------------------------
    // PAYMENT CREATE
    // ---------------------------------------------------------

    async function submitPayment(event) {
        event.preventDefault();

        if (state.submittingPayment) {
            return;
        }

        const studentId = elements.paymentStudent?.value ?? "";
        const rawAmount = elements.paymentAmount?.value ?? "";
        const paymentDate = elements.paymentDate?.value ?? "";
        const amount = Number(rawAmount);

        if (!studentId) {
            showMessage("Avval o‘quvchini tanlang.", "error");
            elements.paymentStudent?.focus();
            return;
        }

        if (
            rawAmount.trim() === "" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            showMessage(
                "To‘lov summasi noldan katta bo‘lishi kerak.",
                "error"
            );
            elements.paymentAmount?.focus();
            return;
        }

        if (!isValidDate(paymentDate)) {
            showMessage("To‘lov sanasini to‘g‘ri kiriting.", "error");
            elements.paymentDate?.focus();
            return;
        }

        state.submittingPayment = true;

        if (elements.submitPayment) {
            elements.submitPayment.disabled = true;
            elements.submitPayment.textContent = "Saqlanmoqda...";
        }

        showMessage("To‘lov serverga yuborilmoqda...", "");

        try {
            await apiRequest(API.payments, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...csrfHeaders(),
                },
                body: JSON.stringify({
                    student: studentId,
                    amount: amount.toFixed(2),
                    payment_date: paymentDate,
                }),
            });

            showMessage("To‘lov muvaffaqiyatli saqlandi.", "success");

            elements.paymentForm.reset();

            if (elements.paymentDate) {
                elements.paymentDate.value = currentLocalDate();
            }

            await refreshDashboard();
        } catch (error) {
            console.error("To‘lovni saqlash xatosi:", error);

            showMessage(
                error.message || "To‘lovni saqlab bo‘lmadi.",
                "error"
            );
        } finally {
            state.submittingPayment = false;

            if (elements.submitPayment) {
                elements.submitPayment.disabled = false;
                elements.submitPayment.textContent = "To‘lovni saqlash";
            }
        }
    }

    function handleDebtorTableClick(event) {
        const button = event.target.closest("[data-pay-student]");

        if (!button || !elements.debtorsTable.contains(button)) {
            return;
        }

        const studentId = button.dataset.payStudent;

        if (!studentId || !elements.paymentStudent) {
            return;
        }

        elements.paymentStudent.value = studentId;

        document.getElementById("payment")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        elements.paymentAmount?.focus();
    }

    // ---------------------------------------------------------
    // TABLE RENDERING
    // ---------------------------------------------------------

    function renderStudents() {
        const table = elements.studentsTable;

        if (!table) {
            return;
        }

        const query = (elements.studentSearch?.value || "")
            .trim()
            .toLocaleLowerCase();

        const filtered = state.students.filter((student) => {
            const searchable = [
                student.name,
                student.phone,
                student.group_name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLocaleLowerCase();

            return searchable.includes(query);
        });

        table.replaceChildren();

        if (filtered.length === 0) {
            setTableMessage(
                table,
                STUDENT_COLUMNS,
                query
                    ? "Qidiruv bo‘yicha o‘quvchi topilmadi."
                    : "Hozircha o‘quvchilar mavjud emas."
            );
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const student of filtered) {
            const row = document.createElement("tr");

            appendCell(row, student.name || "—");
            appendCell(row, student.phone || "—");
            appendCell(row, student.group_name || "—");
            appendCell(
                row,
                formatCurrency(student.monthly_fee),
                "money-cell"
            );

            const actions = document.createElement("td");
            actions.className = "student-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "button button-secondary button-small";
            editButton.textContent = "Tahrirlash";
            editButton.dataset.studentAction = "edit";
            editButton.dataset.studentId = String(student.id ?? "");
            editButton.disabled = student.id == null;
            editButton.setAttribute(
                "aria-label",
                `${student.name || "O‘quvchi"} ma’lumotlarini tahrirlash`
            );

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "button button-secondary button-small";
            deleteButton.textContent = "O‘chirish";
            deleteButton.dataset.studentAction = "delete";
            deleteButton.dataset.studentId = String(student.id ?? "");
            deleteButton.disabled = student.id == null;
            deleteButton.setAttribute(
                "aria-label",
                `${student.name || "O‘quvchi"}ni o‘chirish`
            );

            actions.append(editButton, deleteButton);
            row.appendChild(actions);
            fragment.appendChild(row);
        }

        table.appendChild(fragment);
    }

    function renderStudentOptions() {
        const select = elements.paymentStudent;

        if (!select) {
            return;
        }

        const previousValue = select.value;
        const fragment = document.createDocumentFragment();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "O‘quvchini tanlang";
        fragment.appendChild(placeholder);

        for (const student of state.students) {
            if (student.id == null) {
                continue;
            }

            const option = document.createElement("option");
            option.value = String(student.id);
            option.textContent =
                `${student.name || "Nomsiz o‘quvchi"} · ID ${student.id}`;

            fragment.appendChild(option);
        }

        select.replaceChildren(fragment);

        if (
            previousValue &&
            state.students.some(
                (student) => String(student.id) === previousValue
            )
        ) {
            select.value = previousValue;
        }
    }

    function renderDebtors() {
        const table = elements.debtorsTable;

        if (!table) {
            return;
        }

        table.replaceChildren();

        if (state.debtors.length === 0) {
            setTableMessage(
                table,
                DEBTOR_COLUMNS,
                "Tanlangan oy uchun qarzdorlar topilmadi."
            );
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const debtor of state.debtors) {
            const row = document.createElement("tr");

            appendCell(row, debtor.name || "—");
            appendCell(row, debtor.group_name || "—");
            appendCell(row, formatCurrency(debtor.monthly_fee));
            appendCell(row, formatCurrency(debtor.paid_amount));
            appendCell(
                row,
                formatCurrency(getDebtAmount(debtor)),
                "debt-cell"
            );

            const actionCell = document.createElement("td");
            const button = document.createElement("button");

            button.type = "button";
            button.className = "button button-secondary";
            button.dataset.payStudent = String(
                debtor.student_id ?? debtor.id ?? ""
            );
            button.textContent = "To‘lov";
            button.disabled = !button.dataset.payStudent;

            actionCell.appendChild(button);
            row.appendChild(actionCell);
            fragment.appendChild(row);
        }

        table.appendChild(fragment);
    }

    function appendCell(row, value, className = "") {
        const cell = document.createElement("td");

        // API ma'lumotlari HTML sifatida emas, oddiy matn sifatida chiqariladi.
        cell.textContent = String(value ?? "—");

        if (className) {
            cell.className = className;
        }

        row.appendChild(cell);
        return cell;
    }

    function setTableMessage(table, columnCount, message) {
        if (!table) {
            return;
        }

        table.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = columnCount;
        cell.className = "empty-state";
        cell.textContent = message;

        row.appendChild(cell);
        table.appendChild(row);
    }

    // ---------------------------------------------------------
    // MESSAGES / HELPERS
    // ---------------------------------------------------------

    function showMessage(message, type = "") {
        if (!elements.paymentMessage) {
            return;
        }

        elements.paymentMessage.textContent = message;
        elements.paymentMessage.classList.remove("success", "error");

        if (type === "success" || type === "error") {
            elements.paymentMessage.classList.add(type);
        }
    }

    function showStudentMessage(message, type = "") {
        if (!elements.studentMessage) {
            return;
        }

        elements.studentMessage.textContent = message;
        elements.studentMessage.classList.remove("success", "error");

        if (type === "success" || type === "error") {
            elements.studentMessage.classList.add(type);
        }
    }

    function setRefreshLoading(isLoading) {
        if (!elements.refreshButton) {
            return;
        }

        elements.refreshButton.disabled = isLoading;
        elements.refreshButton.textContent = isLoading
            ? "Yangilanmoqda..."
            : "Yangilash";
    }

    async function apiRequest(url, options = {}) {
        let response;

        try {
            response = await fetch(url, {
                ...options,
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    ...options.headers,
                },
            });
        } catch (error) {
            throw new Error(
                "Server bilan aloqa o‘rnatilmadi. " +
                "Django serveri ishlayotganini tekshiring."
            );
        }

        const contentType = response.headers.get("content-type") || "";
        let payload = null;

        if (response.status !== 204) {
            if (contentType.includes("application/json")) {
                try {
                    payload = await response.json();
                } catch {
                    throw new Error("Server noto‘g‘ri JSON javob qaytardi.");
                }
            } else {
                const text = await response.text();

                if (!response.ok) {
                    throw new Error(
                        `Server xatosi: HTTP ${response.status}. ` +
                        (text.slice(0, 180) || "Server javobini tekshiring.")
                    );
                }

                throw new Error(
                    "API JSON o‘rniga boshqa format qaytardi. " +
                    "URL va Django view sozlamalarini tekshiring."
                );
            }
        }

        if (!response.ok) {
            throw new Error(describeApiError(payload, response.status));
        }

        return payload;
    }

    function extractList(payload) {
        if (Array.isArray(payload)) {
            return payload;
        }

        if (payload && Array.isArray(payload.results)) {
            return payload.results;
        }

        if (payload && Array.isArray(payload.data)) {
            return payload.data;
        }

        throw new Error("API javobi kutilgan ro‘yxat formatida emas.");
    }

    function getTotalStudentCount(payload) {
        if (
            payload &&
            !Array.isArray(payload) &&
            Number.isFinite(Number(payload.count))
        ) {
            return Number(payload.count);
        }

        return state.students.length;
    }

    function getDebtAmount(debtor) {
        const amount = Number(debtor.debt);
        return Number.isFinite(amount) ? Math.max(0, amount) : 0;
    }

    function formatCurrency(value) {
        const amount = Number(value);

        if (!Number.isFinite(amount)) {
            return "—";
        }

        return new Intl.NumberFormat("uz-UZ", {
            maximumFractionDigits: 2,
        }).format(amount) + " so‘m";
    }

    function formatNumber(value) {
        return new Intl.NumberFormat("uz-UZ").format(value);
    }

    function currentLocalDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function currentLocalMonth() {
        return currentLocalDate().slice(0, 7);
    }

    function isValidMonth(value) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || "")) {
            return false;
        }

        const year = Number(value.slice(0, 4));
        return year >= 1 && year <= 9999;
    }

    function isValidDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
            return false;
        }

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
        );
    }

    function csrfHeaders() {
        const token = getCookie("csrftoken");
        return token ? { "X-CSRFToken": token } : {};
    }

    function getCookie(name) {
        const prefix = `${name}=`;
        const cookies = document.cookie
            ? document.cookie.split(";")
            : [];

        for (const cookie of cookies) {
            const item = cookie.trim();

            if (item.startsWith(prefix)) {
                return decodeURIComponent(item.slice(prefix.length));
            }
        }

        return "";
    }

    function describeApiError(payload, status) {
        if (payload && typeof payload === "object") {
            if (typeof payload.detail === "string") {
                return `HTTP ${status}: ${payload.detail}`;
            }

            const messages = [];

            for (const [field, errors] of Object.entries(payload)) {
                const list = Array.isArray(errors) ? errors : [errors];

                for (const error of list) {
                    if (typeof error === "string") {
                        messages.push(`${field}: ${error}`);
                    } else if (error != null) {
                        messages.push(`${field}: ${String(error)}`);
                    }
                }
            }

            if (messages.length) {
                return messages.join(" · ");
            }
        }

        return `So‘rov bajarilmadi (HTTP ${status}).`;
    }
})();
