import os
from html import escape

import resend
from flask import Flask, jsonify, request, send_from_directory


# The website and API are served by the same Render service. This keeps the
# browser request same-origin and avoids a separate, hard-coded backend URL.
app = Flask(__name__, static_folder=".", static_url_path="")


@app.after_request
def allow_configured_frontend(response):
    """Allow a separately hosted frontend only when its origin is configured."""
    allowed_origin = os.getenv("ALLOWED_ORIGIN")
    if allowed_origin and request.headers.get("Origin") == allowed_origin:
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return response


@app.get("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/send-confirmation", methods=["POST", "OPTIONS"])
def send_confirmation():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip()
    name = str(data.get("name", "")).strip()
    address = str(data.get("address", "")).strip()
    product = str(data.get("product", "")).strip()
    artwork = str(data.get("artwork", "")).strip()
    size = str(data.get("size", "")).strip()
    quantity = str(date.get("quantity", "")).strip()
    phone_model = str(data.get("phonemodel", "")).strip()
    order_notes = str(data.get("order_notes", "")).strip()

    safe_name = escape(name)
    safe_email = escape(email)
    safe_address = escape(address)
    safe_product = escape(product)
    safe_artwork = escape(artwork)
    safe_size = escape(size)
    safe_phonemodel = escape(phone_model)
    safe_ordernotes = escape(order_notes)
    safe_quantity = escape(quantity)

    if not email or "@" not in email:
        return jsonify({"message": "Vul een geldig e-mailadres in."}), 400

    # RESEND_API_KEY is the conventional environment variable name. The old
    # ruben_email name is retained temporarily so an existing deployment does
    # not stop working while its environment variable is renamed.
    resend.api_key = os.getenv("RESEND_API_KEY") or os.getenv("ruben_email")
    if not resend.api_key:
        app.logger.error("RESEND_API_KEY is not configured")
        return jsonify({"message": "De e-mailservice is nog niet geconfigureerd."}), 500

    sender = os.getenv("EMAIL_FROM", "Ruben's Drawings <orders@ruben-slooijer-art.com>")
    recipient_name = escape(name or "daar")

    customer_mail = {
        "from": sender,
        "to": [safe_email],
        "subject": "Betaling en verzending",
        "html": f"""
            <h1>Bedankt voor je bestelling, {recipient_name}.</h1>
            <p>Ruben Slooijer stuurt je binnenkort een e-mail met een betaalverzoek.
            Na betaling wordt je product verzonden.</p>
            <p>Je bestelde product is {safe_product} met kunstwerk {safe_artwork}</p>
        """,
        "text": (
            f"Bedankt voor je bestelling, {recipient_name}. Ruben Slooijer stuurt je "
            "binnenkort een e-mail met een betaalverzoek. Na betaling wordt je product verzonden."
            f"Je bestelde product is {product} met kunstwerk {artwork}"
        ),
    }
    ruben_mail = {
        "from": sender,
        "to": ["racslooijer@gmail.com"],
        "subject": "Een klant heeft besteld!",
        "html": f"""
                <h1>Een klant heeft besteld!</h1>
                <p>De naam van de klant is {recipient_name}</p>
                <p>De email van de klant is {safe_email}</p>
                <p>Het adress van de klant is {safe_address}</p>
                <p>Het product dat de klant heeft besteld is {safe_quantity} keer {safe_product} met de artwork {safe_artwork}. De prijzen kun je hieronder zien in de prijzenlijst.</p>
                <p>Als de klant een T-Shirt heeft beseld zie je hier de size {safe_size}</p>
                <p>Als de klant een telefoonhoes heeft besteld zie je hier de telefoonmodel van de klant {safe_phonemodel}</p>
                <p>Als de klant order notes heeft achtergelaten zie je die hier {safe_ordernotes}</p>
                <h2>Prijzenlijst</h2>
                <p>A5 poster: 15 euro</p>
                <p>A4 poster: 20 euro</p>
                <p>A3 poster: 25 euro</p>
                <p>Fine art print: 30 euro</p>
                <p>Mok: 15 euro</p>
                <p>T-Shirt: 25 euro, over sized 30 euro</p>
                <p>Hoodie: 40 euro</p>
                <p>Telefoon hoesje: 20 euro</p>
                <p>Koelkastmagneet: 12 euro</p>
            """,
        "text": f"""
            Nieuwe bestelling ontvangen
            Naam klant: {name}
            E-mailadres: {email}
            Adres: {address}
            Product: {product}
            Artwork: {artwork}
        """,
    }
    try:
        resend.Emails.send(ruben_mail)
        resend.Emails.send(customer_mail)
    
    except Exception as error:
        print(error)
        return jsonify({
            "message": "De e-mails konden niet worden verstuurd."
        }), 500
    
    return jsonify({
    "message": "Bestelling ontvangen. De bevestigingsmail is verzonden."
}), 200
