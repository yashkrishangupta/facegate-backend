-- Run once, against a fresh database, before logging in for the first time.
-- There is no self-registration endpoint by design (POST /faculty, the only
-- thing that auto-creates a login, requires an existing ADMIN+ account) —
-- so the very first admin has to be inserted directly.
--
-- Login: username = superadmin, password = Admin@123
-- CHANGE THIS PASSWORD immediately after your first login via
-- PUT /admin/change-password — this hash is public (it's in this file).

INSERT INTO admin_user
    (employee_id, username, first_name, last_name, email, password_hash, role, account_status)
VALUES
    ('EMP0001', 'superadmin', 'Super', 'Admin', 'superadmin@facegate.local',
     '$2b$10$X6w3/K4zeDW/Rc8HDEwy5uY/2yodaSNPTpLemj/54urEVbTrPEIfa',
     'SUPER_ADMIN', 'ACTIVE');
