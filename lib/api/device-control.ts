export const controlDevice = async (deviceId: number, component: string, value: boolean) => {
  console.log(`Controlling device ${deviceId} - ${component}:`, value);
};

export const setSystemMode = async (mode: 'MANUAL' | 'AUTOMATIC') => {
  console.log("Setting mode to:", mode);
  return { success: true };
};

export const mapControlToComponent = (key: string): string => {
  const map: Record<string, string> = {
    pump:                "dosing_pump",
    fan:                 "dc_fan",
    growLight:           "grow_light",
    humidityController:  "humidity_controller",
  }
  return map[key] ?? key
}