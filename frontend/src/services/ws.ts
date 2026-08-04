import { LiveProgressMessage } from '../types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback: ((data: LiveProgressMessage) => void) | null = null;
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null;
  private reconnectTimer: any = null;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws/progress`;
  }

  public connect(
    onMessage: (data: LiveProgressMessage) => void,
    onStatusChange: (connected: boolean) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(true);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.ws.onmessage = (event) => {
        try {
          const data: LiveProgressMessage = JSON.parse(event.data);
          if (this.onMessageCallback) this.onMessageCallback(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.onMessageCallback && this.onStatusChangeCallback) {
        this.connect(this.onMessageCallback, this.onStatusChangeCallback);
      }
    }, 3000);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
