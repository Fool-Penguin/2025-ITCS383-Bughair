package edu.mahidol.bughair;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class WebFallbackActivity extends Activity {
    public static final String EXTRA_PATH = "path";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);

        String path = getIntent().getStringExtra(EXTRA_PATH);
        webView.loadUrl(BughairConfig.webUrl(path == null ? "/" : path));
    }
}
