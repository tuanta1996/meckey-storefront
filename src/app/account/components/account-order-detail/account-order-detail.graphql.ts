import { gql } from "apollo-angular";

import {
    CART_FRAGMENT,
    ORDER_ADDRESS_FRAGMENT,
    FULFILLMENTS,
} from "../../../common/graphql/fragments.graphql";

export const GET_ORDER = gql`
    query GetOrder($code: String!) {
        orderByCode(code: $code) {
            ...Cart
            shippingAddress {
                ...OrderAddress
            }
            billingAddress {
                ...OrderAddress
            }
            fulfillments {
                ...Fulfillment
            }
        }
    }
    ${FULFILLMENTS}
    ${CART_FRAGMENT}
    ${ORDER_ADDRESS_FRAGMENT}
`;
