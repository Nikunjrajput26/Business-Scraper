"""Send outreach email through a user's own SMTP / Gmail account."""

import smtplib
import ssl
from email.message import EmailMessage


def send_email(user, to_address: str, subject: str, body: str) -> None:
    """Send a plain-text email using the user's configured SMTP credentials.

    Raises RuntimeError with a friendly message on any failure.
    """
    if not user.has_smtp:
        raise RuntimeError("Configure your email (SMTP) settings first.")
    if not to_address:
        raise RuntimeError("This lead has no email address.")

    host = user.smtp_host.strip()
    port = int(user.smtp_port or 587)
    username = user.smtp_username.strip()
    password = user.smtp_password
    from_name = (user.smtp_from_name or username).strip()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{username}>"
    msg["To"] = to_address
    msg.set_content(body)

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=20) as server:
                server.login(username, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.starttls(context=ssl.create_default_context())
                server.login(username, password)
                server.send_message(msg)
    except smtplib.SMTPAuthenticationError as exc:  # noqa: BLE001
        raise RuntimeError(
            "SMTP login failed. For Gmail, use an App Password (not your normal password)."
        ) from exc
    except Exception as exc:  # noqa: BLE001 - surface any SMTP failure to the user
        raise RuntimeError(f"Could not send email: {exc}") from exc
