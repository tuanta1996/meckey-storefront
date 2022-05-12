import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { gql } from "apollo-angular";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { GetCollection, ProductVariant } from "src/app/common/generated-types";
import { AssetPreviewPipe } from "src/app/shared/pipes/asset-preview.pipe";
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
    productList$: Observable<any[]>;
    productListLoaded$: Observable<boolean>;
    featureProduct$: Observable<any>;
    banner$: Observable<SafeStyle>;
    readonly placeholderProducts = Array.from({ length: 12 }).map(() => null);
    constructor(
        private dataService: DataService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        const collection = this.dataService
            .query<GetCollection.Query, GetCollection.Variables>(
                GET_COLLECTION,
                {
                    slug: "feature",
                }
            )
            .pipe(map((data) => data.collection));

        const topSellers = collection.pipe(
            map((data) => (data as any).productVariants.items),
            shareReplay(1)
        );

        this.topSellers$ = topSellers.pipe(
            map((data: ProductVariant[]) => {
                return data.map((item: ProductVariant) => {
                    return {
                        __typename: "SearchResult",
                        priceWithTax: {
                            __typename: "PriceRange",
                            min: item.priceWithTax,
                            max: item.priceWithTax,
                        },
                        productAsset:
                            item.assets.length > 0 ? item.assets[0] : undefined,
                        productId: item.productId,
                        productName: item.product.name,
                        slug: item.product.slug,
                        customFields: item.product.customFields,
                    };
                });
            }),
            shareReplay(1)
        );
        this.topSellersLoaded$ = topSellers.pipe(
            map((items) => 0 < items.length)
        );

        this.productList$ = this.dataService.query(GET_PRODUCT_LIST).pipe(
            map((data) => data.search.items),
            shareReplay(1)
        );
        this.productListLoaded$ = this.productList$.pipe(
            map((items) => 0 < items.length)
        );

        this.featureProduct$ = topSellers.pipe(
            map((productList) => {
                return productList.find(
                    (product: ProductVariant) =>
                        product.product.customFields.featuredBanner !== null
                );
            })
        );
        const assetPreviewPipe = new AssetPreviewPipe();
        this.banner$ = this.featureProduct$.pipe(
            map((product) => {
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
            map((style) => this.sanitizer.bypassSecurityTrustStyle(style))
        );
    }
}

const GET_PRODUCT_LIST = gql`
    query GetProductList {
        search(
            input: {
                skip: 4
                take: 12
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
            }
        }
    }
`;

const GET_TOP_SELLERS = gql`
    query GetTopSellers {
        search(input: { take: 4, groupByProduct: true, sort: { price: ASC } }) {
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
            }
        }
    }
`;
