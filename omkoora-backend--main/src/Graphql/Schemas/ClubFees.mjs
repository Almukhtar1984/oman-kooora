import {gql} from "apollo-server-express";

// رسوم الطلبات ومدفوعاتها.
// النادي يضبط أسعاره، وكل طلب يكلّف مالاً يحمل دفعته: ما هو، وكم، وإيصاله
// ورقمه المرجعي. والدفع كامل لا مجزّأ.
export const typeDefs = gql`

    extend type Query {
        # قائمة أسعار النادي — كل الأنواع تُعاد ولو لم يسعّرها النادي بعد.
        clubFees: [ClubFee!] @auth(requires: user)
        # المدفوعات: النادي يرى مدفوعاته كلها، والفريق يرى مدفوعاته هو.
        requestPayments(status: String, idTeam: ID): [RequestPayment!] @auth(requires: user)
    }

    extend type Mutation {
        # النادي يسعّر خدمة أو يوقفها.
        saveClubFee(fee_type: String!, amount: Float, active: Boolean): ClubFee! @auth(requires: user)
        # النادي يطالب فريقاً بدفع رسوم طلب بعينه.
        createRequestPayment(content: contentRequestPayment!): RequestPayment! @auth(requires: user)
        # الفريق يرفع الإيصال ورقمه المرجعي بعد الدفع.
        submitPaymentReceipt(id: ID!, reference_number: String!, receipt: Upload, amount: Float): statusUpdate @auth(requires: user)
        # الفريق يسدّد عدّة مطالبات بتحويلٍ واحد — موسم المسابقات: ثلاث إعارات
        # وانتقال بإيصال مئة ريال. كل مطالبة تحمل الإيصال ورقمه، فيعرف النادي ما
        # سدّده كل جزء.
        submitPaymentsReceipt(ids: [ID!]!, reference_number: String!, receipt: Upload, amount: Float): statusUpdate @auth(requires: user)
        # النادي يعتمد الإيصال أو يرفضه مع السبب (فيعود الطلب لانتظار الدفع).
        decidePayment(id: ID!, status: String!, note: String): statusUpdate @auth(requires: user)
    }

    input contentRequestPayment {
        fee_type:    String!
        id_team:     ID!
        amount:      Float
        entity_type: String
        entity_id:   ID
        note:        String
    }

    type ClubFee {
        id:       ID
        fee_type: String
        label:    String
        amount:   Float
        active:   Boolean
    }

    type RequestPayment {
        id:                ID
        fee_type:          String
        label:             String
        amount:            Float
        entity_type:       String
        entity_id:         ID
        # اللاعب الذي تسدّد عنه المطالبة، ورقمه المدني.
        subject:           String
        subject_card:      String
        status:            String
        reference_number:  String
        receipt:           String @imgUrl
        note:              String
        decision_note:     String
        paid_at:           Date @date(format: "yyyy-MM-dd")
        decided_at:        Date @date(format: "yyyy-MM-dd")
        createdAt:         Date @date(format: "yyyy-MM-dd")
        team:              Team
        club:              Club
    }
`;
