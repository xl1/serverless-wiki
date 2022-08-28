export type MessageResponse = {
    status: number,
    body: { message: string },
};

export type SuccessResponse<T> = {
    status: 200,
    body: T,
    headers?: { [key: string]: string },
    isRaw?: boolean
};

export const msg = (status: number, message: string): MessageResponse => ({
    status,
    body: { message }
});
