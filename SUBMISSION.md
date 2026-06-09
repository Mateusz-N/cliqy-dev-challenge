## Krok 3 — co zrobiłem/am i dlaczego
Dodałem panel statystyk kolejki, który pokazuje liczbę wiadomości o danych statusach (oczekujące, zatwierdzone, odrzucone) oraz dominującą kategorię zgłoszeń.

Celem było zapewnienie szybkiego wglądu w stan systemu bez konieczności analizy pojedynczych elementów listy. Taki widok usprawnia ocenę backlogu i ułatwia priorytetyzację pracy.

Funkcja ta pozwoliła szybko dodać wartość produktową przy minimalnej złożoności integracyjnej - a dzięki temu zapobiec potencjalnym bugom, które mogły się pojawić przy okazji bardziej kompleksowych opcji i pociągnąć ze sobą niekorzystny stosunek nakładu pracy do realnych efektów.

---

## AI — jak używałem/am narzędzi

- **Narzędzia:** ChatGPT (zawsze z funkcją "Myślenie") jako główny "programming buddy", GitHub Copilot (VSCode) do autouzupełniania i sugestii poprawek
- **Prompt który zadziałał najlepiej:**
    "Zaimplementuj endpoint klasyfikacji wiadomości w Next.js, który zwraca kategorię, priorytet, draft odpowiedzi i confidence w formacie JSON. Uwzględnij walidację wejścia i wymuś poprawny JSON output."

    ...Ale generalnie wklejałem fragmenty kodu wraz z treścią polecenia i prosiłem o zaproponowanie implementacji lub zdebugowanie konkretnego problemu. Kluczowe było iteracyjne doprecyzowywanie wymagań na podstawie otrzymanych odpowiedzi (np. wymuszenie walidacji, obsługi błędów i przypadków brzegowych...).

- **Gdzie AI się pomylił/a i co poprawiłem/am ręcznie:**
    AI początkowo nie uwzględniało pełnej obsługi błędów z API OpenAI, co skutkowało generycznym błędem 500 bez informacji diagnostycznych. Dodałem logowanie błędów explicite z API, co umożliwiło precyzyjniejszą identyfikację problemów (np. brak quota / błędy autoryzacji).

    Wprowadziłem również tryb mock API na potrzeby developmentu, aby umożliwić pracę bez aktywnego zużywania kredytów oraz przyspieszyć iterację UI.

    Podczas implementacji UI wystąpiły problemy z nieprzewidywalnym "przenoszeniem" stanu hover/active między przyciskami. Rozwiązałem to poprzez zapewnienie unikalnych kluczy kontenerowi z uwzględnieniem stanu edycji (edit/actions), co wyeliminowało artefakty renderowania.

    Dodatkowo wprowadziłem drobne poprawki struktury i formatowania kodu w celu poprawy czytelności i utrzymania spójnego stylu.

- **Szacowany udział AI w kodzie:**
  - objętościowo: ~75% wygenerowane / współtworzone przez AI
  - czasowo: ~75% pracy własnej (tj. nie wliczając formułowania promptów), z naciskiem na debugowanie, integrację i dopracowanie logiki