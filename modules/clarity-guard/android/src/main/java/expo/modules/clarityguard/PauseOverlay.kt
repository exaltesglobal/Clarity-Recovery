package expo.modules.clarityguard

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONObject

/**
 * The mindful pause, drawn by [MindfulPauseService] as an accessibility overlay on top of the app
 * the user just opened. Texts, colours and the user's reasons come from the app (see setPauseConfig),
 * so the overlay matches the chosen language and theme.
 */
class PauseOverlay(
  context: Context,
  private val ui: JSONObject,
  private val appName: String,
  private val onLeave: () -> Unit,
  private val onContinue: () -> Unit,
  private val onSupport: () -> Unit,
) : FrameLayout(context) {
  private val density = resources.displayMetrics.density
  private val colors = ui.optJSONObject("colors") ?: JSONObject()
  private val breathing: ValueAnimator

  private fun dp(value: Int) = (value * density).toInt()

  private fun color(key: String, fallback: String) =
    try {
      Color.parseColor(colors.optString(key, fallback))
    } catch (_: IllegalArgumentException) {
      Color.parseColor(fallback)
    }

  private fun label(key: String, fallback: String) = ui.optString(key, fallback).replace(APP_TOKEN, appName)

  init {
    isFocusable = true
    isFocusableInTouchMode = true
    setBackgroundColor(color("bg", "#F5F3EE"))
    if (ui.optBoolean("rtl")) layoutDirection = View.LAYOUT_DIRECTION_RTL

    val column = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(24), dp(56), dp(24), dp(40))
    }

    column.addView(text(label("title", "Pause for a moment"), 26f, color("text", "#1E2A28"), bold = true))
    column.addView(text(label("body", "You're opening $appName."), 16f, color("muted", "#5F6B69")), spaced(10))

    val circle = View(context).apply {
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(color("accent", "#DCEBE6"))
        setStroke(dp(3), color("primary", "#2E6E6A"))
      }
    }
    column.addView(circle, LinearLayout.LayoutParams(dp(150), dp(150)).apply { topMargin = dp(28); bottomMargin = dp(12) })
    // Same rhythm as the in-app breathing circle: 4 s in, 4 s out.
    breathing = ValueAnimator.ofFloat(0.72f, 1f).apply {
      duration = 4000
      repeatMode = ValueAnimator.REVERSE
      repeatCount = ValueAnimator.INFINITE
      interpolator = AccelerateDecelerateInterpolator()
      addUpdateListener {
        val s = it.animatedValue as Float
        circle.scaleX = s
        circle.scaleY = s
      }
    }
    column.addView(text(label("breathe", "Take three slow breaths."), 14f, color("muted", "#5F6B69")))

    val reasons = ui.optJSONArray("reasons")
    if (reasons != null && reasons.length() > 0) {
      val card = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(16), dp(14), dp(16), dp(14))
        background = rounded(color("card", "#FFFFFF"), 18)
      }
      card.addView(text(label("reasonsTitle", "Remember why"), 13f, color("primary", "#2E6E6A"), bold = true, center = false))
      for (i in 0 until reasons.length()) {
        card.addView(text("♥  " + reasons.optString(i), 15f, color("text", "#1E2A28"), center = false), spaced(6))
      }
      column.addView(card, spaced(20).apply { width = MATCH_PARENT })
    }

    column.addView(button(label("leave", "Leave $appName"), color("primary", "#2E6E6A"), color("onPrimary", "#FFFFFF")) { onLeave() }, spaced(24))
    column.addView(button(label("support", "I need support"), color("danger", "#C0564B"), color("onDanger", "#FFFFFF")) { onSupport() }, spaced(10))

    // Going on takes two taps on purpose: first "I still want to open it", then "Open for 10 minutes".
    val proceed = button(label("continue", "Open $appName for 10 minutes"), Color.TRANSPARENT, color("muted", "#5F6B69")) { onContinue() }
    proceed.visibility = View.GONE
    val notNow = button(label("notNow", "I still want to open it"), Color.TRANSPARENT, color("muted", "#5F6B69")) {}
    notNow.setOnClickListener {
      notNow.visibility = View.GONE
      proceed.visibility = View.VISIBLE
    }
    column.addView(notNow, spaced(6))
    column.addView(proceed, spaced(6))

    val scroll = ScrollView(context).apply {
      isFillViewport = true
      addView(column, LayoutParams(MATCH_PARENT, WRAP_CONTENT))
    }
    addView(scroll, LayoutParams(MATCH_PARENT, MATCH_PARENT))
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    breathing.start()
    requestFocus()
  }

  override fun onDetachedFromWindow() {
    breathing.cancel()
    super.onDetachedFromWindow()
  }

  /** The system back gesture leaves the app instead of slipping past the pause. */
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (event.keyCode == KeyEvent.KEYCODE_BACK) {
      if (event.action == KeyEvent.ACTION_UP) onLeave()
      return true
    }
    return super.dispatchKeyEvent(event)
  }

  private fun spaced(top: Int) = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(top) }

  private fun rounded(fill: Int, radius: Int) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = dp(radius).toFloat()
  }

  private fun text(value: String, size: Float, textColor: Int, bold: Boolean = false, center: Boolean = true) =
    TextView(context).apply {
      text = value
      textSize = size
      setTextColor(textColor)
      if (bold) setTypeface(typeface, Typeface.BOLD)
      gravity = if (center) Gravity.CENTER_HORIZONTAL else Gravity.START
      textAlignment = if (center) View.TEXT_ALIGNMENT_CENTER else View.TEXT_ALIGNMENT_VIEW_START
      setLineSpacing(0f, 1.15f)
    }

  private fun button(value: String, fill: Int, textColor: Int, onClick: () -> Unit) =
    TextView(context).apply {
      text = value
      textSize = 16f
      setTextColor(textColor)
      setTypeface(typeface, Typeface.BOLD)
      gravity = Gravity.CENTER
      minHeight = dp(52)
      setPadding(dp(16), dp(12), dp(16), dp(12))
      background = rounded(fill, 16)
      isClickable = true
      isFocusable = true
      setOnClickListener { onClick() }
    }

  companion object {
    /** Placeholder the app puts where the other app's name goes. */
    const val APP_TOKEN = "%APP%"
  }
}
