import { gql } from "@apollo/client";

export const AllCommittees = gql`
  query AllCommittees($idClub: ID) {
    allCommittees(idClub: $idClub) {
      id
      name
      membersCount
      members {
        id
        name
        phone
      }
    }
  }
`;

export const CreateCommittee = gql`
  mutation CreateCommittee($idClub: ID, $name: String!) {
    createCommittee(idClub: $idClub, name: $name) {
      id
      name
    }
  }
`;

export const UpdateCommittee = gql`
  mutation UpdateCommittee($id: ID!, $name: String!) {
    updateCommittee(id: $id, name: $name) {
      status
    }
  }
`;

export const DeleteCommittee = gql`
  mutation DeleteCommittee($id: ID!) {
    deleteCommittee(id: $id) {
      status
    }
  }
`;

export const CreateCommitteeMember = gql`
  mutation CreateCommitteeMember($idCommittee: ID!, $name: String!, $phone: String) {
    createCommitteeMember(idCommittee: $idCommittee, name: $name, phone: $phone) {
      id
      name
      phone
    }
  }
`;

export const UpdateCommitteeMember = gql`
  mutation UpdateCommitteeMember($id: ID!, $name: String, $phone: String, $idCommittee: ID) {
    updateCommitteeMember(id: $id, name: $name, phone: $phone, idCommittee: $idCommittee) {
      status
    }
  }
`;

export const DeleteCommitteeMember = gql`
  mutation DeleteCommitteeMember($id: ID!) {
    deleteCommitteeMember(id: $id) {
      status
    }
  }
`;
