package com.ship.app.ui.patient

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class PatientProfile(
    val id: String,
    val uhid: String,
    val name: String,
    val dob: String,
    val gender: String,
    val address: String,
    val phone: String,
    val bloodGroup: String?,
    val allergies: String?,
    val chronicConditions: String?,
    val emergencyContact: String,
    val emergencyPhone: String,
    val emergencyNotes: String?,
    val consentFlag: Boolean
)

interface PatientProfileProps {
    val profile: PatientProfile?
    val isLoading: Boolean
    val errorMsg: String?
    val onRefresh: () -> Unit
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientProfileScreen(
    props: PatientProfileProps,
    modifier: Modifier = Modifier
) {
    // Design tokens
    val primaryColor = Color(0xFF006874)
    val secondaryColor = Color(0xFF4A6267)
    val backgroundColor = Color(0xFFF1F5F9)
    val surfaceVariantColor = Color(0xFFE2E8F0)
    val onSurfaceColor = Color(0xFF0F172A)
    val errorColor = Color(0xFFBA1A1A)

    Surface(
        modifier = modifier.fillMaxSize(),
        color = backgroundColor
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            // Header Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = "My Profile",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif,
                    color = primaryColor,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                if (props.profile != null) {
                    Text(
                        text = "UHID: ${props.profile!!.uhid}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = secondaryColor
                    )
                }
            }

            if (props.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = primaryColor)
                }
            } else if (props.errorMsg != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = props.errorMsg!!,
                        color = errorColor,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    Button(
                        onClick = props.onRefresh,
                        colors = ButtonDefaults.buttonColors(containerColor = primaryColor)
                    ) {
                        Text("Retry")
                    }
                }
            } else if (props.profile == null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No profile data available.", color = secondaryColor)
                }
            } else {
                val profile = props.profile!!
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Personal Section
                    ProfileCard(title = "Personal Details", primaryColor = primaryColor) {
                        ProfileRow(label = "Full Name", value = profile.name, onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Date of Birth", value = profile.dob, onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Gender", value = profile.gender, onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Phone Number", value = profile.phone, onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Residential Address", value = profile.address, onSurfaceColor = onSurfaceColor)
                    }

                    // Medical Section
                    ProfileCard(title = "Medical Profile", primaryColor = primaryColor) {
                        ProfileRow(label = "Blood Group", value = profile.bloodGroup ?: "Not Specified", onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Allergies", value = profile.allergies ?: "None Recorded", onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Chronic Conditions", value = profile.chronicConditions ?: "None Recorded", onSurfaceColor = onSurfaceColor)
                    }

                    // Emergency Contact Section
                    ProfileCard(title = "Emergency Contacts", primaryColor = primaryColor) {
                        ProfileRow(label = "Contact Person", value = profile.emergencyContact, onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Emergency Phone", value = profile.emergencyPhone, onSurfaceColor = onSurfaceColor)
                        ProfileRow(label = "Emergency Notes", value = profile.emergencyNotes ?: "None", onSurfaceColor = onSurfaceColor)
                    }

                    // Consent Section (Read-only status)
                    ProfileCard(title = "Privacy & Consent Settings", primaryColor = primaryColor) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = profile.consentFlag,
                                onCheckedChange = null, // Read-only checkbox status
                                enabled = false
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "Global Medical Record Opt-in Consent",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = onSurfaceColor
                               )
                                Text(
                                    text = if (profile.consentFlag) "You have opted-in to share medical records with clinical staff."
                                           else "Your records are currently hidden from clinical staff.",
                                    fontSize = 12.sp,
                                    color = secondaryColor
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
fun ProfileCard(
    title: String,
    primaryColor: Color,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = primaryColor,
                modifier = Modifier.padding(bottom = 4.dp)
            )
            Divider(color = Color(0xFFE2E8F0))
            content()
        }
    }
}

@Composable
fun ProfileRow(
    label: String,
    value: String,
    onSurfaceColor: Color
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = Color.Gray
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Normal,
            color = onSurfaceColor
        )
    }
}
