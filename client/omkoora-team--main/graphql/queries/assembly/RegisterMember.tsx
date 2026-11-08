import {gql} from "@apollo/client";

// «تسجيل عضو جديد» — الباب الواحد: يدخل العضوية بانتظار اعتماد النادي.
export const RegisterMember = gql`
    mutation RegisterMember($content: contentAssembly!) {
        registerMember(content: $content) {
            id
            status
        }
    }
`;
