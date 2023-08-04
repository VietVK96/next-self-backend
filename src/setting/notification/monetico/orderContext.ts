import { OrderContextBilling } from './orderContextBilling';
import { OrderContextClient } from './orderContextClient';

export class OrderContext {
  private orderContextBilling: OrderContextBilling;
  private orderContextClient: OrderContextClient | null;

  constructor(billing: OrderContextBilling) {
    this.setOrderContextBilling(billing);
  }

  public jsonSerialize(): any {
    return {
      billing: this.getOrderContextBilling(),
      client: this.getOrderContextClient(),
    };
  }

  public getOrderContextBilling(): OrderContextBilling {
    return this.orderContextBilling;
  }

  public setOrderContextBilling(
    orderContextBilling: OrderContextBilling,
  ): this {
    this.orderContextBilling = orderContextBilling;
    return this;
  }

  public getOrderContextClient(): OrderContextClient | null {
    return this.orderContextClient;
  }

  public setOrderContextClient(
    orderContextClient: OrderContextClient | null,
  ): this {
    this.orderContextClient = orderContextClient;
    return this;
  }
}
