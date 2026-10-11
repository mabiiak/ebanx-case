export interface IAccount {
    id: number,
    balance: number,
}

export interface IBalance {
    balance: number;
}

export interface IEvent {
    type: string,
    amount: number,
    destination: number,
    origin?: number,
}
