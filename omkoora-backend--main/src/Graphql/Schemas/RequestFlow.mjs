import {gql} from "apollo-server-express";

// مسار الطلب وخطّ تتبّعه.
// تسجيل لاعب، انتقاله، إعارته، واستقالته: طريق واحد يراه الفريق خطاً، لا
// شارةً واحدة تقول حالته الآن وتمحو ما قبلها.
export const typeDefs = gql`

    extend type Query {
        # مسار طلب بعينه مع خطّه كاملاً — يفتحه الفريق من سجلّ الطلب.
        requestFlow(entity_type: String!, entity_id: ID!): RequestFlow @auth(requires: user)
        # طلبات الفريق، أو طلبات النادي، مرشّحةً بالمرحلة.
        myRequestFlows(stage: String, request_type: String): [RequestFlow!] @auth(requires: user)
        # المراحل التسع ومسمّياتها — كي ترسم الواجهة الخط كاملاً لا المقطوع منه.
        requestFlowStages: [RequestFlowStage!] @auth(requires: user)
    }

    extend type Mutation {
        # نقل الطلب إلى مرحلته التالية. الرفض لا يمرّ بلا سبب.
        advanceRequestFlow(id: ID!, to: String!, reason: String): RequestFlowResult @auth(requires: user)
    }

    type RequestFlowStage {
        stage:  String
        label:  String
        # المسمّى الآخر الذي سمّاه به المالك للحظة نفسها.
        also:   String
        actor:  String
        done:   Boolean
    }

    type RequestFlowEvent {
        id:        ID
        stage:     String
        label:     String
        note:      String
        actor:     String
        createdAt: Date @date(format: "yyyy-MM-dd HH:mm")
    }

    type RequestFlow {
        id:            ID
        request_type:  String
        request_label: String
        # اسم اللاعب الذي عن الطلب — بغيره تتشابه ثلاثون سطراً.
        subject:       String
        entity_type:   String
        entity_id:     ID
        stage:         String
        label:         String
        also:          String
        # دور مَن الآن: الفريق أم النادي — به تفرز كل جهة ما يخصّها.
        actor:         String
        done:          Boolean
        reason:        String
        createdAt:     Date @date(format: "yyyy-MM-dd")
        team:          Team
        club:          Club
        payment:       RequestPayment
        # الخط نفسه، من الأقدم إلى الأحدث.
        events:        [RequestFlowEvent!]
        # ما يجوز لهذا المستدعي فعله الآن — فلا ترسم الواجهة زراً يُرفض ضغطه.
        actions:       [RequestFlowAction!]
    }

    type RequestFlowAction {
        to:          String
        label:       String
        needsReason: Boolean
    }

    type RequestFlowResult {
        ok:      Boolean
        code:    String
        message: String
        flow:    RequestFlow
    }
`;
