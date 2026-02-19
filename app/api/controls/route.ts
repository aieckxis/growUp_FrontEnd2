export async function POST(request: Request) {
  // TODO: Replace with real control commands to IoT backend
  // This endpoint should send commands to your hardware controller
  const body = await request.json()

  return Response.json({
    status: "success",
    data: body,
    message: "Control command sent to system",
    timestamp: new Date().toISOString(),
  })
}
