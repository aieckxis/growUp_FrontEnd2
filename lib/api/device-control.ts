export const controlDevice = async (deviceId: string, value: any) => {
  console.log(`Controlling ${deviceId}:`, value);
};

export const setSystemMode = async (mode: 'manual' | 'auto') => {
  console.log("Setting mode to:", mode);
};

export const mapControlToComponent = (id: string) => id; 