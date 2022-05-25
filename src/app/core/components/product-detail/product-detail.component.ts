import {
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { gql } from "apollo-angular";
import { Subscription, Observable } from "rxjs";
import {
    filter,
    map,
    shareReplay,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { AddToCart, GetProductDetail } from "../../../common/generated-types";
import { notNullOrUndefined } from "../../../common/utils/not-null-or-undefined";
import { DataService } from "../../providers/data/data.service";
import { NotificationService } from "../../providers/notification/notification.service";
import { StateService } from "../../providers/state/state.service";

import { ADD_TO_CART, GET_PRODUCT_DETAIL } from "./product-detail.graphql";

@Component({
    selector: "vsf-product-detail",
    templateUrl: "./product-detail.component.html",
    styleUrls: ["./product-detail.component.scss"],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
    product: GetProductDetail.Product;
    selectedAsset: { id: string; preview: string };
    selectedVariant: GetProductDetail.Variants;
    qty = 1;
    breadcrumbs: GetProductDetail.Breadcrumbs[] | null = null;

    productList$: Observable<any[]>;
    productListLoaded$: Observable<boolean>;
    @ViewChild("addedToCartTemplate", { static: true })
    private addToCartTemplate: TemplateRef<any>;
    private sub: Subscription;

    constructor(
        private dataService: DataService,
        private stateService: StateService,
        private notificationService: NotificationService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        const lastCollectionSlug$ = this.stateService.select(
            (state) => state.lastCollectionSlug
        );
        const productSlug$ = this.route.paramMap.pipe(
            map((paramMap) => paramMap.get("slug")),
            filter(notNullOrUndefined)
        );

        this.sub = productSlug$
            .pipe(
                switchMap((slug) => {
                    return this.dataService.query<
                        GetProductDetail.Query,
                        GetProductDetail.Variables
                    >(GET_PRODUCT_DETAIL, {
                        slug,
                    });
                }),
                map((data) => data.product),
                filter(notNullOrUndefined),
                withLatestFrom(lastCollectionSlug$)
            )
            .subscribe(([product, lastCollectionSlug]) => {
                this.product = product;
                if (this.product.featuredAsset) {
                    this.selectedAsset = this.product.featuredAsset;
                }
                this.selectedVariant = product.variants[0];
                const collection = this.getMostRelevantCollection(
                    product.collections,
                    lastCollectionSlug
                );
                this.breadcrumbs = collection ? collection.breadcrumbs : [];

                const GET_PRODUCT_LIST = gql`
                    query GetProductList {
                        search(
                            input: {
                                take: 4
                                collectionId: ${this.product.collections[0].id}
                                groupByProduct: true
                                sort: { price: ASC }
                            }
                        ) {
                            items {
                                productId
                                slug
                                productAsset {
                                    id
                                    preview
                                }
                                priceWithTax {
                                    ... on PriceRange {
                                        min
                                        max
                                    }
                                }
                                productName
                                collectionIds
                            }
                        }
                    }
                `;

                this.productList$ = this.dataService
                    .query(GET_PRODUCT_LIST)
                    .pipe(
                        map((data) =>
                            data.search.items
                                .filter(
                                    (item: any) => item.productId !== product.id
                                )
                                .slice(0, 3)
                        ),
                        shareReplay(1)
                    );
                this.productListLoaded$ = this.productList$.pipe(
                    map((items: any) => 0 < items.length)
                );
            });
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    addToCart(variant: GetProductDetail.Variants, qty: number) {
        this.dataService
            .mutate<AddToCart.Mutation, AddToCart.Variables>(ADD_TO_CART, {
                variantId: variant.id,
                qty,
            })
            .subscribe(({ addItemToOrder }) => {
                switch (addItemToOrder.__typename) {
                    case "Order":
                        this.stateService.setState(
                            "activeOrderId",
                            addItemToOrder ? addItemToOrder.id : null
                        );
                        if (variant) {
                            this.notificationService
                                .notify({
                                    title: "Added to cart",
                                    type: "info",
                                    duration: 3000,
                                    templateRef: this.addToCartTemplate,
                                    templateContext: {
                                        variant,
                                        quantity: qty,
                                    },
                                })
                                .subscribe();
                        }
                        break;
                    case "OrderModificationError":
                    case "OrderLimitError":
                    case "NegativeQuantityError":
                    case "InsufficientStockError":
                        this.notificationService
                            .error(addItemToOrder.message)
                            .subscribe();
                        break;
                }
            });
    }

    viewCartFromNotification(closeFn: () => void) {
        this.stateService.setState("cartDrawerOpen", true);
        closeFn();
    }

    changeOption(e: any) {
        document
            .querySelectorAll("label." + e.target.classList[0])
            ?.forEach((label: any) => label.classList.remove("active"));
        document
            .querySelector("#label-" + e.target.value)
            ?.classList.add("active");

        let options: any[] = [];
        document.querySelectorAll("input")?.forEach((input: any) => {
            if (input.checked) {
                options.push(
                    this.product.optionGroups
                        .find((optionGroup) => optionGroup.name === input.name)
                        ?.options.find((option) => option.id === input.id)
                );
            }
        });

        let findVariant = this.product.variants.find((variant) =>
            this.areOptionEqual(variant.options, options)
        );

        this.selectedVariant = findVariant
            ? findVariant
            : this.product.variants[0];
    }

    /**
     * If there is a collection matching the `lastCollectionId`, return that. Otherwise return the collection
     * with the longest `breadcrumbs` array, which corresponds to the most specific collection.
     */
    private getMostRelevantCollection(
        collections: GetProductDetail.Collections[],
        lastCollectionSlug: string | null
    ) {
        const lastCollection = collections.find(
            (c) => c.slug === lastCollectionSlug
        );
        if (lastCollection) {
            return lastCollection;
        }
        return collections.slice().sort((a, b) => {
            if (a.breadcrumbs.length < b.breadcrumbs.length) {
                return 1;
            }
            if (a.breadcrumbs.length > b.breadcrumbs.length) {
                return -1;
            }
            return 0;
        })[0];
    }

    private areOptionEqual(array1: any[], array2: any[]) {
        if (array1.length === array2.length) {
            return array1.every((element) => {
                if (array2.find((el) => el.id === element.id)) {
                    return true;
                }

                return false;
            });
        }

        return false;
    }
}
