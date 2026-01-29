import { createSlice } from "@reduxjs/toolkit";
import { HRAsyncReducer } from "../AsyncReducers/asyncreducer.js";
import {
  HandlePostHumanResources,
  HandleGetHumanResources,
  HandleHRLogout,
} from "../Thunks/HRThunk.js";

const HRSlice = createSlice({
  name: "HumanResources",
  initialState: {
    data: null,
    isLoading: false,
    isAuthenticated: false,
    isSignUp: false,
    isAuthourized: false,
    isVerified: false,
    isVerifiedEmailAvailable: false,
    isResetPassword: false,
    error: {
      status: false,
      message: null,
      content: null,
    },
  },
  extraReducers: (builder) => {
    HRAsyncReducer(builder, HandlePostHumanResources);
    HRAsyncReducer(builder, HandleGetHumanResources);
    builder
      .addCase(HandleHRLogout.pending, (state) => {
        state.isLoading = true;
        state.error.content = null;
      })
      .addCase(HandleHRLogout.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.isAuthourized = false;
        state.isVerified = false;
        state.isVerifiedEmailAvailable = false;
        state.error.status = false;
        state.data = action.payload;
      })
      .addCase(HandleHRLogout.rejected, (state, action) => {
        state.isLoading = false;
        state.error.status = true;
        state.error.message = action.payload?.message;
        state.error.content = action.payload;
      });
  },
});

export default HRSlice.reducer;
