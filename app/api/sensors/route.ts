// growup/updated/app/api/sensors/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  // Replace with your actual ngrok URL
  const NGROK_URL = "http://192.168.210.142:8000/sensors"

  try {
    const res = await fetch(NGROK_URL, {
      headers: {
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
      },
      // Add cache control to get fresh data
      cache: 'no-store'
    })
    
    if (!res.ok) {
      throw new Error(`Failed to fetch sensor data: ${res.status}`)
    }

    const raspberryData = await res.json()

    // Validate that we got the expected data structure
    if (!raspberryData.data) {
      throw new Error('Invalid data structure from Raspberry Pi')
    }

    // Map Raspberry Pi data structure to dashboard expected format
    const sensorData = {
      // Water temperature from DS18B20 sensor
      waterTemp: raspberryData.data.ds18b20?.temperature ?? 23.2,
      
      // pH from pH sensor
      ph: raspberryData.data.ph?.ph ?? 6.8,
      
      // Dissolved O2 - NOT IN YOUR CURRENT SENSORS
      // TODO: Add dissolved oxygen sensor or remove from dashboard
      dissolvedO2: 7.2,
      
      // Water level - NOT IN YOUR CURRENT SENSORS
      // TODO: Add ultrasonic/float sensor or remove from dashboard
      waterLevel: 85,
      
      // Water flow - NOT IN YOUR CURRENT SENSORS
      // TODO: Add flow meter sensor or remove from dashboard
      waterFlow: 4.5,
      
      // Humidity from BME280
      humidity: raspberryData.data.bme280?.humidity ?? 65,
      
      // Ammonia - NOT IN YOUR CURRENT SENSORS
      // TODO: Add ammonia sensor or remove from dashboard
      ammonia: 0.3,
      
      // Light intensity from light sensor
      lightIntensity: raspberryData.data.light?.lux ?? 15000,
      
      // Air temperature from BME280
      airTemp: raspberryData.data.bme280?.temperature ?? 25.5,
      
      // Air pressure from BME280
      airPressure: raspberryData.data.bme280?.pressure ?? 1012.0,
    }

    return NextResponse.json({
      status: "success",
      data: sensorData,
      timestamp: new Date().toISOString(),
      rawData: raspberryData.data, // Include raw data for debugging
    })
    
  } catch (error: any) {
    console.error("❌ Sensor fetch error:", error)
    
    return NextResponse.json({
      status: "error",
      message: error.message || "Failed to fetch sensor data",
      timestamp: new Date().toISOString(),
    }, { 
      status: 500 
    })
  }
}

// Optional: Add POST endpoint for future use
export async function POST(request: Request) {
  return NextResponse.json({
    status: "error",
    message: "POST method not implemented yet",
  }, { 
    status: 501 
  })
}