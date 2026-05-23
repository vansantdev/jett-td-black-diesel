const DTC_DESCRIPTIONS = {

  // =========================
  // FUEL / AIR METERING
  // =========================

  P0001: "Fuel Volume Regulator Control Circuit/Open",
  P0002: "Fuel Volume Regulator Control Circuit Range/Performance",
  P0003: "Fuel Volume Regulator Control Circuit Low",
  P0004: "Fuel Volume Regulator Control Circuit High",
  P0005: "Fuel Shutoff Valve Control Circuit/Open",
  P0006: "Fuel Shutoff Valve Control Circuit Low",
  P0007: "Fuel Shutoff Valve Control Circuit High",

  P0010: "Camshaft Position Actuator Circuit Bank 1",
  P0011: "Camshaft Position Timing Over-Advanced Bank 1",
  P0012: "Camshaft Position Timing Over-Retarded Bank 1",
  P0013: "Camshaft Position Actuator Circuit Bank 1 Exhaust",
  P0014: "Camshaft Position Timing Over-Advanced Exhaust",
  P0015: "Camshaft Position Timing Over-Retarded Exhaust",

  P0100: "Mass Air Flow Sensor Circuit",
  P0101: "Mass Air Flow Sensor Range / Performance",
  P0102: "Mass Air Flow Sensor Circuit Low",
  P0103: "Mass Air Flow Sensor Circuit High",
  P0104: "Mass Air Flow Sensor Circuit Intermittent",

  P0110: "Intake Air Temperature Sensor Circuit",
  P0111: "Intake Air Temperature Sensor Range / Performance",
  P0112: "Intake Air Temperature Sensor Low Input",
  P0113: "Intake Air Temperature Sensor High Input",
  P0114: "Intake Air Temperature Sensor Intermittent",

  P0120: "Throttle Position Sensor Circuit",
  P0121: "Throttle Position Sensor Range / Performance",
  P0122: "Throttle Position Sensor Low Input",
  P0123: "Throttle Position Sensor High Input",
  P0124: "Throttle Position Sensor Intermittent",
  P0128: "Coolant Thermostat Below Regulating Temperature",

  P0130: "O2 Sensor Circuit Bank 1 Sensor 1",
  P0131: "O2 Sensor Circuit Low Voltage Bank 1 Sensor 1",
  P0132: "O2 Sensor Circuit High Voltage Bank 1 Sensor 1",
  P0133: "O2 Sensor Slow Response Bank 1 Sensor 1",
  P0134: "O2 Sensor No Activity Bank 1 Sensor 1",
  P0135: "O2 Sensor Heater Circuit Bank 1 Sensor 1",
  P0136: "O2 Sensor Circuit Bank 1 Sensor 2",
  P0137: "O2 Sensor Circuit Low Voltage Bank 1 Sensor 2",
  P0138: "O2 Sensor Circuit High Voltage Bank 1 Sensor 2",
  P0140: "O2 Sensor No Activity Bank 1 Sensor 2",
  P0141: "O2 Sensor Heater Circuit Bank 1 Sensor 2",

  P0150: "O2 Sensor Circuit Bank 2 Sensor 1",
  P0151: "O2 Sensor Circuit Low Voltage Bank 2 Sensor 1",
  P0152: "O2 Sensor Circuit High Voltage Bank 2 Sensor 1",
  P0153: "O2 Sensor Slow Response Bank 2 Sensor 1",
  P0154: "O2 Sensor No Activity Bank 2 Sensor 1",
  P0155: "O2 Sensor Heater Circuit Bank 2 Sensor 1",

  P0171: "System Too Lean Bank 1",
  P0172: "System Too Rich Bank 1",
  P0174: "System Too Lean Bank 2",
  P0175: "System Too Rich Bank 2",

  P0190: "Fuel Rail Pressure Sensor Circuit",
  P0191: "Fuel Rail Pressure Sensor Range / Performance",
  P0192: "Fuel Rail Pressure Sensor Low Input",
  P0193: "Fuel Rail Pressure Sensor High Input",

  // =========================
  // IGNITION / MISFIRE
  // =========================

  P0300: "Random / Multiple Cylinder Misfire Detected",
  P0301: "Cylinder 1 Misfire Detected",
  P0302: "Cylinder 2 Misfire Detected",
  P0303: "Cylinder 3 Misfire Detected",
  P0304: "Cylinder 4 Misfire Detected",
  P0305: "Cylinder 5 Misfire Detected",
  P0306: "Cylinder 6 Misfire Detected",
  P0307: "Cylinder 7 Misfire Detected",
  P0308: "Cylinder 8 Misfire Detected",

  P0325: "Knock Sensor Circuit Bank 1",
  P0335: "Crankshaft Position Sensor Circuit",
  P0340: "Camshaft Position Sensor Circuit",

  // =========================
  // EGR / TURBO / EMISSIONS
  // =========================

  P0299: "Turbocharger Underboost Condition",
  P0234: "Turbocharger Overboost Condition",

  P0400: "EGR Flow Malfunction",
  P0401: "EGR Flow Insufficient",
  P0402: "EGR Flow Excessive",
  P0403: "EGR Control Circuit",

  P0420: "Catalyst System Efficiency Below Threshold Bank 1",
  P0430: "Catalyst System Efficiency Below Threshold Bank 2",

  // =========================
  // EVAP SYSTEM
  // =========================

  P0440: "EVAP System Malfunction",
  P0441: "EVAP Incorrect Purge Flow",
  P0442: "EVAP Small Leak Detected",
  P0443: "EVAP Purge Control Valve Circuit",
  P0444: "EVAP Purge Control Valve Circuit Open",
  P0445: "EVAP Purge Control Valve Circuit Shorted",
  P0446: "EVAP Vent Control Circuit",
  P0447: "EVAP Vent Control Circuit Open",
  P0448: "EVAP Vent Control Circuit Shorted",
  P0449: "EVAP Vent Valve / Solenoid Circuit",
  P0450: "EVAP Pressure Sensor Malfunction",
  P0451: "EVAP Pressure Sensor Range / Performance",
  P0452: "EVAP Pressure Sensor Low Input",
  P0453: "EVAP Pressure Sensor High Input",
  P0454: "EVAP Pressure Sensor Intermittent",
  P0455: "EVAP Gross Leak / Large Leak Detected",
  P0456: "EVAP Very Small Leak Detected",
  P0457: "EVAP Leak Detected / Fuel Cap Loose",
  P0458: "EVAP Purge Control Valve Circuit Low",
  P0459: "EVAP Purge Control Valve Circuit High",

  P0460: "Fuel Level Sensor Circuit",
  P0461: "Fuel Level Sensor Range / Performance",
  P0462: "Fuel Level Sensor Low Input",
  P0463: "Fuel Level Sensor High Input",
  P0464: "Fuel Level Sensor Intermittent",

  P0471: "Exhaust Pressure Sensor Range / Performance",

  // =========================
  // IDLE / SPEED / VOLTAGE
  // =========================

  P0500: "Vehicle Speed Sensor Malfunction",
  P0505: "Idle Control System Malfunction",

  P0560: "System Voltage Malfunction",
  P0562: "System Voltage Low",
  P0563: "System Voltage High",

  P0600: "Serial Communication Link",
  P0601: "Internal Control Module Memory Checksum Error",
  P0606: "ECM / PCM Processor Fault",

  // =========================
  // GLOW PLUG / DIESEL
  // =========================

  P0380: "Glow Plug / Heater Circuit",
  P0671: "Glow Plug Cylinder 1 Circuit",
  P0672: "Glow Plug Cylinder 2 Circuit",
  P0673: "Glow Plug Cylinder 3 Circuit",
  P0674: "Glow Plug Cylinder 4 Circuit",

  // =========================
  // TRANSMISSION
  // =========================

  P0700: "Transmission Control System Malfunction",
  P0715: "Input/Turbine Speed Sensor Circuit",
  P0720: "Output Speed Sensor Circuit",
  P0730: "Incorrect Gear Ratio",
  P0740: "Torque Converter Clutch Circuit",

  // =========================
  // ABS / CHASSIS
  // =========================

  C0035: "Left Front Wheel Speed Sensor",
  C0040: "Right Front Wheel Speed Sensor",
  C0045: "Left Rear Wheel Speed Sensor",
  C0050: "Right Rear Wheel Speed Sensor",

  C0245: "Wheel Speed Signal Frequency Error",

  // =========================
  // BODY
  // =========================

  B0020: "Driver Frontal Deployment Loop",
  B0028: "Passenger Frontal Deployment Loop",
  B1000: "Control Module Configuration Error",

  // =========================
  // NETWORK / CAN BUS
  // =========================

  U0001: "High Speed CAN Communication Bus",
  U0100: "Lost Communication With ECM/PCM",
  U0101: "Lost Communication With TCM",
  U0121: "Lost Communication With ABS Control Module",
  U0140: "Lost Communication With Body Control Module",
  U0155: "Lost Communication With Instrument Panel Cluster",

};