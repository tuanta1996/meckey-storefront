import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Maybe } from "graphql/jsutils/Maybe";

import { Scalars, SearchProducts } from "../../../common/generated-types";

@Component({
    selector: "vsf-product-card",
    templateUrl: "./product-card.component.html",
    styleUrls: ["./product-card.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
    @Input() product: SearchProducts.Items & {
        customFields?: Maybe<Scalars["JSON"]>;
    };
}
