// growup/updated/app/api/sensors/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  const RASPI_URL = "http://192.168.210.142:8000/sensors"

  try {
    const res = await fetch(RASPI_URL, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      throw new Error(`Failed to fetch sensor data: ${res.status}`)
    }

    const raspberryData = await res.json()

    if (!raspberryData.data) {
      throw new Error('Invalid data structure from Raspberry Pi')
    }

    const sensorData = {
      // Water temperature from DS18B20 sensor
      waterTemp: raspberryData.data.ds18b20?.temperature ?? 23.2,
      
      // pH from pH sensor
      ph: raspberryData.data.ph?.ph ?? 6.8,
      
      // Humidity from BME280
      humidity: raspberryData.data.bme280?.humidity ?? 65,
      
      // Light intensity from BH1750
      lightIntensity: raspberryData.data.light?.lux ?? 15000,
      
      // Air temperature from BME280
      airTemp: raspberryData.data.bme280?.temperature ?? 25.5,
      
      // Air pressure from BME280
      airPressure: raspberryData.data.bme280?.pressure ?? 1012.0,
      
      // Water flow from YF-S201 flow meter
      waterFlow: raspberryData.data.flow?.rate ?? 4.5,
    }

    return NextResponse.json({
      status: "success",
      data: sensorData,
      timestamp: new Date().toISOString(),
      rawData: raspberryData.data,
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

export async function POST(request: Request) {
  return NextResponse.json({
    status: "error",
    message: "POST method not implemented yet",
  }, { 
    status: 501 
  })
}