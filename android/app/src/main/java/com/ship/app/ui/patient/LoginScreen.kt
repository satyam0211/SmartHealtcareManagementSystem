package com.ship.app.ui.patient

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Props matching Bolt / Lovable specs
interface PatientLoginProps {
    val onSendOtp: (String) -> Unit
    val onLoginConfirm: (String) -> Unit
    val isLoading: Boolean
    val errorMsg: String?
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientLoginScreen(
    props: PatientLoginProps,
    modifier: Modifier = Modifier
) {
    var phoneNumber by remember { mutableStateOf("") }
    var otpCode by remember { mutableStateOf("") }
    var isOtpSent by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }

    // Color Tokens
    val primaryColor = Color(0xFF006874)
    val secondaryColor = Color(0xFF4A6267)
    val backgroundColor = Color(0xFFF1F5F9)
    val surfaceColor = Color(0xFFF8FAFC)
    val onPrimaryColor = Color(0xFFFFFFFF)
    val onSurfaceColor = Color(0xFF0F172A)
    val errorColor = Color(0xFFBA1A1A)

    Surface(
        modifier = modifier.fillMaxSize(),
        color = backgroundColor
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top branding section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "SHIP Mobile",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif,
                    color = primaryColor,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = "Smart Healthcare Intelligence Platform",
                    fontSize = 14.sp,
                    color = secondaryColor,
                    textAlign = TextAlign.Center
                )
            }

            // Input Fields stacked in center
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Phone Number field
                OutlinedTextField(
                    value = phoneNumber,
                    onValueChange = { input ->
                        // Enforce numeric only and exactly 10 digits validation limit
                        if (input.all { it.isDigit() } && input.length <= 10) {
                            phoneNumber = input
                            localError = null
                        }
                    },
                    label = { Text("Phone Number") },
                    placeholder = { Text("10-digit mobile number") },
                    prefix = { Text("+1 ") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = primaryColor,
                        unfocusedBorderColor = secondaryColor,
                        textColor = onSurfaceColor
                    ),
                    singleLine = true,
                    enabled = !props.isLoading && !isOtpSent
                )

                // OTP Code field (visible only after code is sent)
                if (isOtpSent) {
                    OutlinedTextField(
                        value = otpCode,
                        onValueChange = { input ->
                            if (input.all { it.isDigit() } && input.length <= 6) {
                                otpCode = input
                            }
                        },
                        label = { Text("Verification Code") },
                        placeholder = { Text("6-digit code") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = TextFieldDefaults.outlinedTextFieldColors(
                            focusedBorderColor = primaryColor,
                            unfocusedBorderColor = secondaryColor,
                            textColor = onSurfaceColor
                        ),
                        singleLine = true,
                        enabled = !props.isLoading
                    )
                }

                // Error Messages
                val activeError = props.errorMsg ?: localError
                if (activeError != null) {
                    Text(
                        text = activeError,
                        color = errorColor,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Start,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }

            // Buttons stacked at bottom
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (props.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                        color = primaryColor
                    )
                } else {
                    if (!isOtpSent) {
                        OutlinedButton(
                            onClick = {
                                if (phoneNumber.length != 10) {
                                    localError = "Phone number must be exactly 10 digits."
                                } else {
                                    props.onSendOtp(phoneNumber)
                                    isOtpSent = true
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = primaryColor
                            )
                        ) {
                            Text(
                                text = "Send OTP",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    } else {
                        Button(
                            onClick = {
                                if (otpCode.length < 6) {
                                    localError = "Enter the 6-digit verification code."
                                } else {
                                    props.onLoginConfirm(otpCode)
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = primaryColor,
                                contentColor = onPrimaryColor
                            )
                        ) {
                            Text(
                                text = "Login",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        TextButton(
                            onClick = {
                                isOtpSent = false
                                otpCode = ""
                            },
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text(
                                text = "Change Phone Number",
                                color = secondaryColor,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
