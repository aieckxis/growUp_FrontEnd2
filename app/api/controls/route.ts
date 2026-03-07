// growup/updated/app/api/controls/route.ts

import { NextResponse } from 'next/server'

const RASPI_URL = "http://192.168.210.142:8000"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const res = await fetch(`${RASPI_URL}/controls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Raspberry Pi rejected the command: ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json({
      status: "success",
      data: data,
      message: "Control command sent to system",
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error("❌ Control command error:", error)

    return NextResponse.json({
      status: "error",
      message: error.message || "Failed to send control command",
      timestamp: new Date().toISOString(),
    }, {
      status: 500
    })
  }
}