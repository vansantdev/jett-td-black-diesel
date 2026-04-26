from flask import Flask, jsonify
from flask_cors import CORS
import obd
import time

app = Flask(__name__)
CORS(app)

connection = None
last_data = {
    "connected": False,
    "source": "OFFLINE",
    "rpm": None,
    "coolant": None,
    "speed": None,
    "map": None,
    "intakeTemp": None,
    "voltage": None,
    "boost": None,
    "codes": [],
    "updated": None
}

def safe_value(response, unit=None):
    if response is None or response.is_null():
        return None

    try:
        if unit:
            return round(response.value.to(unit).magnitude, 1)
        return round(response.value.magnitude, 1)
    except Exception:
        try:
            return str(response.value)
        except Exception:
            return None

def connect_obd():
    global connection

    if connection and connection.is_connected():
        return True

    try:
        connection = obd.OBD(fast=False, timeout=5)
        return connection.is_connected()
    except Exception:
        connection = None
        return False

@app.route("/connect")
def connect():
    ok = connect_obd()
    return jsonify({"connected": ok})

@app.route("/disconnect")
def disconnect():
    global connection

    try:
        if connection:
            connection.close()
    except Exception:
        pass

    connection = None
    last_data["connected"] = False
    last_data["source"] = "DISCONNECTED"

    return jsonify({"connected": False})

@app.route("/live")
def live():
    global last_data

    if not connect_obd():
        last_data["connected"] = False
        last_data["source"] = "OFFLINE"
        return jsonify(last_data)

    try:
        rpm = connection.query(obd.commands.RPM)
        coolant = connection.query(obd.commands.COOLANT_TEMP)
        speed = connection.query(obd.commands.SPEED)
        intake = connection.query(obd.commands.INTAKE_TEMP)
        voltage = connection.query(obd.commands.CONTROL_MODULE_VOLTAGE)
        map_sensor = connection.query(obd.commands.INTAKE_PRESSURE)

        rpm_val = safe_value(rpm)
        coolant_f = safe_value(coolant, "degF")
        speed_mph = safe_value(speed, "mph")
        intake_f = safe_value(intake, "degF")
        voltage_v = safe_value(voltage, "volt")
        map_kpa = safe_value(map_sensor, "kPa")

        boost_psi = None
        if map_kpa is not None:
            # Approx boost = MAP absolute pressure minus atmosphere
            boost_psi = round((map_kpa - 101.3) * 0.145038, 1)
            if boost_psi < 0:
                boost_psi = 0

        last_data = {
            "connected": True,
            "source": "OBD LIVE",
            "rpm": rpm_val,
            "coolant": coolant_f,
            "speed": speed_mph,
            "map": map_kpa,
            "intakeTemp": intake_f,
            "voltage": voltage_v,
            "boost": boost_psi,
            "codes": [],
            "updated": int(time.time())
        }

        return jsonify(last_data)

    except Exception as e:
        last_data["connected"] = False
        last_data["source"] = "ERROR"
        last_data["error"] = str(e)
        return jsonify(last_data)

@app.route("/codes")
def codes():
    if not connect_obd():
        return jsonify({"connected": False, "codes": []})

    try:
        response = connection.query(obd.commands.GET_DTC)
        codes = response.value if not response.is_null() else []
        return jsonify({"connected": True, "codes": codes})
    except Exception:
        return jsonify({"connected": True, "codes": []})

if __name__ == "__main__":
    print("JETT TD OBD bridge running on http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False)