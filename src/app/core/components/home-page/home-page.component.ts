import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { gql } from "apollo-angular";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { GetCollection } from "../../../common/generated-types";
import { AssetPreviewPipe } from "../../../shared/pipes/asset-preview.pipe";
import { DataService } from "../../providers/data/data.service";
import { GET_COLLECTION } from "../product-list/product-list.graphql";

@Component({
    selector: "vsf-home-page",
    templateUrl: "./home-page.component.html",
    styleUrls: ["./home-page.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
    topSellers$: Observable<any[]>;
    topSellersLoaded$: Observable<boolean>;
    featureProduct$: Observable<any>;
    banner$: Observable<SafeStyle>;

    productList$: Observable<any[]>;
    productListLoaded$: Observable<boolean>;

    readonly placeholderProducts = Array.from({ length: 12 }).map(() => null);
    constructor(
        private dataService: DataService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        // Get featured information
        const collection = this.dataService
            .query<GetCollection.Query, GetCollection.Variables>(
                GET_COLLECTION,
                {
                    slug: "featured",
                }
            )
            .pipe(map((data) => data.collection));

        const topSellers = collection.pipe(
            map((data: any) =>
                Object.entries(
                    data.productVariants.items
                        .filter((item: any) =>
                            localStorage.getItem("language")
                                ? item.product.languageCode ===
                                  localStorage.getItem("language")
                                : item.product.languageCode === "vi"
                        )
                        .reduce((groups: any[], item: any) => {
                            const group = groups[item.productId] || [];
                            group.push(item);
                            groups[item.productId] = group;
                            return groups;
                        }, {})
                ).map((item: any) => {
                    return item.length > 1
                        ? item[1].length > 0
                            ? item[1][0]
                            : ""
                        : "";
                })
            ),
            shareReplay(1)
        );

        this.topSellers$ = topSellers.pipe(
            map((data: any[]) => {
                return data
                    .filter(
                        (el: any) =>
                            el.product.customFields.featuredBanner === null
                    )
                    .map((item: any) => {
                        return {
                            __typename: "SearchResult",
                            priceWithTax: {
                                __typename: "PriceRange",
                                min: item.priceWithTax,
                                max: item.priceWithTax,
                            },
                            productAsset: item.product.featuredAsset,
                            productId: item.productId,
                            productName: item.product.name,
                            slug: item.product.slug,
                            customFields: item.product.customFields,
                        };
                    })
                    .filter(
                        (value: any, index: number, array: any[]) =>
                            array
                                .map((e) => e.productId)
                                .indexOf(value.productId) === index
                    );
            }),
            shareReplay(1)
        );

        this.topSellersLoaded$ = topSellers.pipe(
            map((items) => 0 < items.length)
        );
        const featureCollectionId = collection.pipe(
            map((data: any) => data.id)
        );
        featureCollectionId.subscribe((id) => {
            this.productList$ = this.dataService.query(GET_PRODUCT_LIST).pipe(
                map((data) =>
                    data.search.items.filter((item: any) => {
                        return !item.collectionIds.includes(id);
                    })
                ),
                shareReplay(1)
            );

            this.productListLoaded$ = this.productList$.pipe(
                map((items) => 0 < items.length)
            );
        });

        this.featureProduct$ = topSellers.pipe(
            map((productList) => {
                return productList.find((product: any) => {
                    return product.product.customFields.featuredBanner !== null;
                });
            })
        );
        const assetPreviewPipe = new AssetPreviewPipe();
        this.banner$ = this.featureProduct$.pipe(
            map((product) => {
                if (product === undefined || product.product === undefined) {
                    return "";
                }
                return (
                    "url(" +
                    assetPreviewPipe.transform(
                        product.product.customFields.featuredBanner ||
                            undefined,
                        1000,
                        300
                    ) +
                    ")"
                );
            }),
            map((style) => {
                return style !== ""
                    ? this.sanitizer.bypassSecurityTrustStyle(style)
                    : "";
            })
        );
    }
}

const GET_PRODUCT_LIST = gql`
    query GetProductList {
        search(
            input: { take: 12, groupByProduct: true, sort: { price: ASC } }
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
                customFields
            }
        }
    }
`;
