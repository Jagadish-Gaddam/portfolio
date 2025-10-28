	// Global flag to prevent double submission
	let isSubmitting = false;

	async function isDisposableEmail(email) {
		try {
			const response = await fetch(`https://api.mailcheck.ai/email/${encodeURIComponent(email)}`, {
				method: 'GET',
				headers: { 'Accept': 'application/json' }
			});
			if (!response.ok) return false;
			const data = await response.json();
			return data.disposable === true;
		} catch (err) {
			console.warn('Disposable email check failed:', err);
			return false; // Fail-open: allow if API down
		}
	}

	function validateForm(event) {
		event.preventDefault();

		// Prevent multiple submissions
		if (isSubmitting) return false;
		isSubmitting = true;

		const form = document.getElementById('contact-form');
		const emailInput = form.querySelector('input[name="email"]');
		const email = emailInput.value.trim();

		// Reset previous state
		emailInput.setCustomValidity('');

		// 1. Basic format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			alert('Please enter a valid email address.');
			emailInput.focus();
			isSubmitting = false;
			return false;
		}

		// 2. Check disposable email (async)
		isDisposableEmail(email).then(isTemp => {
			if (isTemp) {
				alert('Temporary or disposable email addresses are not allowed.');
				emailInput.focus();
				isSubmitting = false;
				return;
			}

			// 3. All checks passed → execute reCAPTCHA
			grecaptcha.execute();
		}).catch(err => {
			console.error('Validation error:', err);
			alert('An error occurred during validation. Please try again.');
			isSubmitting = false;
		});

		// Do NOT return true here — submission is now controlled via reCAPTCHA callback
		return false;
	}

	// This is called by reCAPTCHA when user completes challenge
	function onSubmit(token) {
		if (isSubmitting) {
			document.getElementById('contact-form').submit();
		}
	}

	// Reset flag if reCAPTCHA expires or fails
	window.onCaptchaExpiry = () => {
		isSubmitting = false;
		grecaptcha.reset();
	};

	// Optional: reset on form reset
	document.getElementById('contact-form').addEventListener('reset', () => {
		setTimeout(() => {
			isSubmitting = false;
			grecaptcha.reset();
		}, 100);
	});