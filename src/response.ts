import { HttpResponseInit } from "@azure/functions";

export const msg = (status: number, message: string): HttpResponseInit => ({
    status,
    jsonBody: { message }
});
