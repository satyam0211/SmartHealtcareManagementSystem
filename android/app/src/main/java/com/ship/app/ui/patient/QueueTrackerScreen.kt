package com.ship.app.ui.patient

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

data class QueueTokenStatus(
    val tokenId: String,
    val tokenNumber: String,
    val patientsAhead: Int,
    val estimatedWaitTimeMinutes: Int,
    val status: String, // "Waiting", "In-Consultation", "Completed", "Cancelled"
    val doctorName: String? = null,
    val doctorSpecialty: String? = null
)

interface QueueTrackerProps {
    val activeTokens: List<QueueTokenStatus>
    val isLoading: Boolean
    val errorMsg: String?
    val onRefresh: () -> Unit
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QueueTrackerScreen(
    props: QueueTrackerProps,
    modifier: Modifier = Modifier
) {
    // Design tokens
    val primaryColor = Color(0xFF006874)
    val secondaryColor = Color(0xFF4A6267)
    val backgroundColor = Color(0xFFF1F5F9)
    val surfaceColor = Color(0xFFFFFFFF)
    val glowColor = Color(0xFF00BFA5) // Glowing Teal border
    val errorColor = Color(0xFFBA1A1A)

    // 30-Second HTTP Polling using Coroutines (WebSockets are strictly forbidden per ADR-02)
    LaunchedEffect(Unit) {
        while (true) {
            delay(30000L)
            props.onRefresh()
        }
    }

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
                    text = "Live Queue Tracking",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif,
                    color = primaryColor,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Real-time updates of your outpatient department wait status",
                    fontSize = 14.sp,
                    color = secondaryColor
                )
            }

            if (props.isLoading && props.activeTokens.isEmpty()) {
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
            } else if (props.activeTokens.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = surfaceColor),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "No Active Queue Tokens",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = primaryColor
                            )
                            Text(
                                text = "If you have already arrived at the clinic, please check-in at the reception desk to generate your token.",
                                fontSize = 14.sp,
                                color = secondaryColor,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = props.onRefresh,
                                colors = ButtonDefaults.buttonColors(containerColor = primaryColor)
                            ) {
                                Text("Refresh Now")
                            }
                        }
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    props.activeTokens.forEach { token ->
                        LiveQueueCard(
                            token = token,
                            primaryColor = primaryColor,
                            secondaryColor = secondaryColor,
                            surfaceColor = surfaceColor,
                            glowColor = glowColor
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
fun LiveQueueCard(
    token: QueueTokenStatus,
    primaryColor: Color,
    secondaryColor: Color,
    surfaceColor: Color,
    glowColor: Color
) {
    val statusLabel = token.status
    val badgeColors = when (statusLabel) {
        "In-Consultation" -> Pair(Color(0xFFD1FAE5), Color(0xFF065F46))
        "Completed" -> Pair(Color(0xFFE2E8F0), Color(0xFF475569))
        "Cancelled" -> Pair(Color(0xFFFEE2E2), Color(0xFF991B1B))
        else -> Pair(Color(0xFFFEF3C7), Color(0xFF92400E)) // "Waiting"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = surfaceColor),
        border = BorderStroke(2.dp, glowColor),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Card Header: Token Number and Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Queue Token",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.Gray
                    )
                    Text(
                        text = token.tokenNumber,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.SansSerif,
                        color = primaryColor
                    )
                }

                Surface(
                    color = badgeColors.first,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = statusLabel,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColors.second,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }

            Divider(color = Color(0xFFE2E8F0))

            // Doctor details (if available)
            if (token.doctorName != null) {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "Consulting Doctor",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.Gray
                    )
                    Text(
                        text = token.doctorName,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A)
                    )
                    if (token.doctorSpecialty != null) {
                        Text(
                            text = token.doctorSpecialty,
                            fontSize = 12.sp,
                            color = secondaryColor
                        )
                    }
                }
                Divider(color = Color(0xFFE2E8F0))
            }

            // Metrics Section
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Patients Ahead
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.Start
                ) {
                    Text(
                        text = "Patients Ahead",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.Gray
                    )
                    Text(
                        text = "${token.patientsAhead}",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A)
                    )
                }

                // Estimated Wait Time
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = "Est. Wait Time",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.Gray
                    )
                    Text(
                        text = if (token.status == "In-Consultation") "Serving Now" 
                               else "${token.estimatedWaitTimeMinutes} Min",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (token.status == "In-Consultation") Color(0xFF065F46) else primaryColor
                    )
                }
            }

            // Refresh caption
            Text(
                text = "Auto-refreshing in the background every 30 seconds.",
                fontSize = 11.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
            )
        }
    }
}
