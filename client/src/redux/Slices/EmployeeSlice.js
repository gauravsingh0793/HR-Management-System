import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AsyncReducer } from "../AsyncReducers/asyncreducer";
import {
  HandlePostEmployees,
  HandleGetEmployees,
  HandleEmployeeLogout,
} from "../Thunks/EmployeeThunk";

const EmployeeSlice = createSlice({
  name: "employees",
  initialState: {
    data: null,
    isLoading: false,
    isAuthenticated: false,
    isAuthourized: false,
    isResetPasswords: false,
    error: {
      status: false,
      message: null,
      content: null,
    },
  },
  extraReducers: (builder) => {
    AsyncReducer(builder, HandlePostEmployees);
    AsyncReducer(builder, HandleGetEmployees);
    builder
      .addCase(HandleEmployeeLogout.pending, (state) => {
        state.isLoading = true;
        state.error.content = null;
      })
      .addCase(HandleEmployeeLogout.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.isAuthourized = false;
        state.error.status = false;
        state.data = action.payload;
      })
      .addCase(HandleEmployeeLogout.rejected, (state, action) => {
        state.isLoading = false;
        state.error.status = true;
        state.error.message = action.payload?.message;
        state.error.content = action.payload;
      });
  },
});

export default EmployeeSlice.reducer;
