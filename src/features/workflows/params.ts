import {parseAsInteger, parseAsString} from "nuqs/server";
import { PAGINATION } from "@/config/constants";

export const workflowsParams = {
    page : parseAsInteger
        .withDefault(PAGINATION.DEFAULT_PAGE)
        .withOptions({clearOnDefault : true}), // no need for localhost:3000/workflows?page=1
    
    pageSize : parseAsInteger
        .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
        .withOptions({clearOnDefault : true}),

    search : parseAsString
        .withDefault("")
        .withOptions({clearOnDefault: true})
};
