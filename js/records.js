(() => {
    const section = document.querySelector(".records");
    if (!section || section.dataset.ready) return;
    section.dataset.ready = "true";

    /* 수상 및 장학 내역 */
    const awards = [
        {
            date: "2024",
            name: "성적우수",
            issuer: "오산대학교",
            result: "B등급",
            note: "2024년도 1학기 성적 상위 우수자"
        },
        {
            date: "2023",
            name: "대한민국디자인전람회(청소년)",
            work: "10월 4일 세계 동물의 날",
            issuer: "한국디자인진흥원",
            result: "특선"
        },
        {
            date: "2023",
            name: "대한민국디자인전람회(청소년)",
            work: "나만의 다이어리 체크카드",
            issuer: "한국디자인진흥원",
            result: "입선"
        },
        {
            date: "2023",
            name: "대한민국디자인전람회(청소년)",
            work: "2024 탄생석 캐릭터 달력 디자인",
            issuer: "한국디자인진흥원",
            result: "입선"
        },
        {
            date: "2021–2023",
            name: "교과우수상",
            issuer: "수원정보과학고등학교",
            result: "총 6회",
            note: "과학, 국어, 미술, 일본어, 전공과목 등"
        },
        {
            date: "2022",
            name: "교내 교복디자인 공모전",
            issuer: "수원정보과학고등학교",
            result: "장려상"
        },
        {
            date: "2022",
            name: "노인권익증진캐릭터 공모전",
            issuer: "용인시기흥노인복지관",
            result: "대상"
        },
        {
            date: "2021",
            name: "수원시 법정호종 및 8대 깃대종 포스터 그리기 대회",
            issuer: "녹색환경보전연합회",
            result: "대상"
        },
        {
            date: "2021",
            name: "입학 성적 우수 장학금",
            issuer: "수원정보과학고등학교",
            note: "전체 수석 입학",
            result: "수석"
        }
    ];

    /* 자격증: 디자인 → 문서·사무 → 외국어 */
    const certificates = [
        {
            date: "2026.08",
            name: "JLPT N3",
            issuer: "국제교류기금 & 일본국제교육지원협회"
        },
        {
            date: "2025.03",
            name: "시각디자인산업기사",
            issuer: "한국산업인력공단"
        },
        {
            date: "2023.07",
            name: "컴퓨터그래픽스운용기능사",
            issuer: "한국산업인력공단"
        },
        {
            date: "2022.05",
            name: "GTQi(그래픽기술자격 일러스트) 1급",
            issuer: "한국생산성본부"
        },
        {
            date: "2022.01",
            name: "ITQ 한글파워포인트(한쇼) A등급",
            issuer: "한국생산성본부"
        },
        {
            date: "2021.12",
            name: "ITQ 한글엑셀 A등급",
            issuer: "한국생산성본부"
        },
        {
            date: "2021.10",
            name: "ITQ 아래한글 A등급",
            issuer: "한국생산성본부"
        },
        {
            date: "2021.09",
            name: "컴퓨터활용능력 2급",
            issuer: "대한상공회의소"
        },
        {
            date: "2021.04",
            name: "GTQ(그래픽기술자격) 1급",
            issuer: "한국생산성본부"
        },
    ];

    function createText(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    }

    function renderList(selector, items) {
        const list = section.querySelector(selector);
        if (!list) return;

        const fragment = document.createDocumentFragment();

        items.forEach((item) => {
            const row = document.createElement("li");
            row.className = "records__item";

            row.append(
                createText("span", "records__date", item.date)
            );

            const content = document.createElement("div");
            content.className = "records__content";

            content.append(
                createText("p", "records__name", item.name)
            );

            if (item.work) {
                content.append(
                    createText("p", "records__work", `「${item.work}」`)
                );
            }

            if (item.issuer) {
                content.append(
                    createText("p", "records__issuer", item.issuer)
                );
            }

            if (item.note) {
                content.append(
                    createText("p", "records__note", item.note)
                );
            }

            row.append(content);

            if (item.result) {
                row.append(
                    createText("span", "records__result", item.result)
                );
            }

            fragment.append(row);
        });

        list.replaceChildren(fragment);
    }

    renderList("#awards-list", awards);
    renderList("#certificates-list", certificates);

    /* 스크롤 등장: 처음 보일 때 한 번만 재생 */
    const reducedMotion = matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    if (
        reducedMotion.matches ||
        !("IntersectionObserver" in window) ||
        !Element.prototype.animate
    ) return;

    const animations = new Set();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            observer.unobserve(entry.target);

            if (reducedMotion.matches) return;

            const animation = entry.target.animate(
                [
                    { opacity: 0, transform: "translateY(1.25rem)" },
                    { opacity: 1, transform: "translateY(0)" }
                ],
                {
                    duration: 650,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
                }
            );

            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
            animation.oncancel = () => animations.delete(animation);
        });
    }, {
        threshold: 0.1
    });

    section.querySelectorAll(
        ".records__header, .records__heading, .records__item"
    ).forEach((element) => observer.observe(element));

    reducedMotion.addEventListener("change", (event) => {
        if (!event.matches) return;

        observer.disconnect();
        animations.forEach((animation) => animation.cancel());
        animations.clear();
    });
})();