import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { SharedModule } from "../shared/shared.module";

import { routes } from "./checkout.routes";
import { CheckoutConfirmationComponent } from "./components/checkout-confirmation/checkout-confirmation.component";
import { CheckoutPaymentComponent } from "./components/checkout-payment/checkout-payment.component";
import { CheckoutProcessComponent } from "./components/checkout-process/checkout-process.component";
import { CheckoutShippingComponent } from "./components/checkout-shipping/checkout-shipping.component";
import { CheckoutSignInComponent } from "./components/checkout-sign-in/checkout-sign-in.component";
import { CheckoutStageIndicatorComponent } from "./components/checkout-stage-indicator/checkout-stage-indicator.component";

// import ngx-translate and the http loader
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { HttpLoaderFactory } from "../app.module";

const DECLARATIONS = [
    CheckoutConfirmationComponent,
    CheckoutPaymentComponent,
    CheckoutShippingComponent,
    CheckoutSignInComponent,
    CheckoutProcessComponent,
    CheckoutStageIndicatorComponent,
];

@NgModule({
    declarations: DECLARATIONS,
    imports: [
        // ngx-translate and the loader module
        HttpClientModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        SharedModule,
        RouterModule.forChild(routes),
    ],
})
export class CheckoutModule {}
