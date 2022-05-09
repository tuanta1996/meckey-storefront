import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { gql } from "apollo-angular";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

import { environment } from "../../../../environments/environment";
import { DataService } from "../../providers/data/data.service";

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
    heroImage: SafeStyle;
    readonly placeholderProducts = Array.from({ length: 12 }).map(() => null);
    constructor(
        private dataService: DataService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.topSellers$ = this.dataService.query(GET_TOP_SELLERS).pipe(
            map((data) => data.search.items),
            shareReplay(1)
        );
        this.topSellersLoaded$ = this.topSellers$.pipe(
            map((items) => 0 < items.length)
        );

        this.productList$ = this.dataService.query(GET_PRODUCT_LIST).pipe(
            map((data) => data.search.items),
            shareReplay(1)
        );
        this.productListLoaded$ = this.productList$.pipe(
            map((items) => 0 < items.length)
        );

        this.heroImage = this.sanitizer.bypassSecurityTrustStyle(
            this.getHeroImageUrl()
        );
    }

    private getHeroImageUrl(): string {
        const { apiHost, apiPort } = environment;
        return `url('${apiHost}:${apiPort}/assets/preview/37/banner__preview.png')`;
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
