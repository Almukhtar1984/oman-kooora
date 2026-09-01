import { useLazyQuery, useMutation } from "@apollo/client";
import {
  AllCommittees, CreateCommittee, UpdateCommittee, DeleteCommittee,
  CreateCommitteeMember, UpdateCommitteeMember, DeleteCommitteeMember,
} from "../..";

export const useAllCommittees = () => useLazyQuery(AllCommittees, { fetchPolicy: "cache-and-network" });
export const useCreateCommittee = () => useMutation(CreateCommittee);
export const useUpdateCommittee = () => useMutation(UpdateCommittee);
export const useDeleteCommittee = () => useMutation(DeleteCommittee);
export const useCreateCommitteeMember = () => useMutation(CreateCommitteeMember);
export const useUpdateCommitteeMember = () => useMutation(UpdateCommitteeMember);
export const useDeleteCommitteeMember = () => useMutation(DeleteCommitteeMember);
